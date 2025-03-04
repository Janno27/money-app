"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { TimePicker } from "@/components/ui/time-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string
  avatar: string
}

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  location: z.string().optional(),
  dateRange: z.object({
    from: z.date(),
    to: z.date().optional(),
  }),
  startTime: z.string().optional(),
  isFullDay: z.boolean().default(false),
  participants: z.array(z.string()).optional(),
})

type FormData = z.infer<typeof formSchema>

interface AddEventDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  defaultDate?: Date | null
}

export function AddEventDialog({ 
  open, 
  onOpenChange,
  onSuccess,
  defaultDate
}: AddEventDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined)
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([])
  const supabase = createClientComponentClient()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      dateRange: {
        from: defaultDate || new Date(),
        to: undefined,
      },
      isFullDay: false,
      participants: [],
    },
  })

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar')
        .order('name')

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      if (data) {
        setUsers(data)
      }
    }

    if (open) {
      fetchUsers()
    }
  }, [open, supabase])

  async function onSubmit(values: FormData) {
    setIsLoading(true)
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!userData.user) throw new Error("Utilisateur non connecté")

      const eventData = {
        title: values.title,
        description: values.description || null,
        location: values.location || null,
        start_date: format(values.dateRange.from, 'yyyy-MM-dd'),
        end_date: values.dateRange.to ? format(values.dateRange.to, 'yyyy-MM-dd') : format(values.dateRange.from, 'yyyy-MM-dd'),
        start_time: values.isFullDay ? null : (values.startTime || null),
        frequency: 'once',
        created_by: userData.user.id,
      }

      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert(eventData)
        .select()
        .single()

      if (eventError) throw eventError

      if (selectedParticipants.length > 0) {
        const participantsData = selectedParticipants.map(user => ({
          event_id: event.id,
          user_id: user.id,
        }))

        const { error: participantsError } = await supabase
          .from('event_participants')
          .insert(participantsData)

        if (participantsError) throw participantsError
      }

      form.reset()
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (error) {
      console.error('Error adding event:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSelect = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user && !selectedUsers.some(u => u.id === userId)) {
      setSelectedUsers([...selectedUsers, user])
      form.setValue('participants', [...selectedUsers.map(u => u.id), userId])
    }
  }

  const handleUserRemove = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId))
    form.setValue('participants', selectedUsers.filter(u => u.id !== userId).map(u => u.id))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ajouter un événement</DialogTitle>
          <DialogDescription>
            Créez un nouvel événement dans votre calendrier.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Titre de l'événement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description de l'événement"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lieu (optionnel)</FormLabel>
                  <FormControl>
                    <Input placeholder="Lieu de l'événement" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dateRange"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Date</FormLabel>
                    <DateRangePicker
                      value={field.value}
                      onChange={field.onChange}
                      showOutsideDays={false}
                      defaultMonth={defaultDate || new Date()}
                      className="[&_.rdp]:bg-background [&_.rdp-day]:text-foreground [&_.rdp-day_button:hover]:bg-primary/10 [&_.rdp-day_button:focus]:bg-primary/10 [&_.rdp-day_button:focus]:ring-primary/20 [&_.rdp-day_button.rdp-day_selected]:bg-primary"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => {
                  const isFullDay = form.watch("isFullDay")
                  return (
                    <FormItem>
                      <FormLabel>Heure</FormLabel>
                      <div className="flex items-center gap-2">
                        <FormControl className="flex-1">
                          <TimePicker
                            value={field.value}
                            onChange={field.onChange}
                            className={cn(
                              isFullDay && "pointer-events-none opacity-50"
                            )}
                          />
                        </FormControl>
                        <FormField
                          control={form.control}
                          name="isFullDay"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormLabel className="text-xs text-muted-foreground">Journée</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked)
                                    if (checked) {
                                      form.setValue('startTime', undefined)
                                    }
                                  }}
                                  className="data-[state=checked]:bg-primary/50"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />
            </div>

            <FormField
              control={form.control}
              name="participants"
              render={() => (
                <FormItem>
                  <FormLabel>Participants</FormLabel>
                  <Select
                    value={selectedUser}
                    onValueChange={(value) => {
                      const user = users.find(u => u.id === value)
                      if (user && !selectedParticipants.some(p => p.id === user.id)) {
                        setSelectedParticipants([...selectedParticipants, user])
                      }
                      setSelectedUser(undefined)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner des participants">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {selectedParticipants.map((participant) => (
                            <div
                              key={participant.id}
                              className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5 text-xs"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedParticipants(selectedParticipants.filter(p => p.id !== participant.id))
                              }}
                            >
                              {participant.avatar ? (
                                <img
                                  src={participant.avatar}
                                  alt={participant.name}
                                  className="h-4 w-4 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="h-4 w-4 rounded-full bg-background flex items-center justify-center text-[0.5rem] flex-shrink-0">
                                  {participant.name[0]}
                                </div>
                              )}
                              <span className="truncate">{participant.name}</span>
                              <X className="h-3 w-3 cursor-pointer hover:text-destructive" />
                            </div>
                          ))}
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-[200px]">
                        {users
                          .filter(user => !selectedParticipants.some(p => p.id === user.id))
                          .map((user) => (
                            <SelectItem
                              key={user.id}
                              value={user.id}
                              className="flex items-center gap-1.5 py-1"
                            >
                              <div className="flex items-center gap-1.5 w-full">
                                {user.avatar ? (
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="h-4 w-4 rounded-full object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[0.5rem] flex-shrink-0">
                                    {user.name[0]}
                                  </div>
                                )}
                                <span className="truncate text-xs">{user.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 