"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
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
import { X } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface User {
  id: string
  name: string
  avatar: string
}

interface Event {
  id: string
  title: string
  description: string | null
  location: string | null
  start_date: string
  end_date: string | null
  start_time: string | null
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  created_by: string
  participants: {
    user: {
      id: string
      name: string
      avatar: string
    }
  }[]
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

interface EditEventSheetProps {
  event: Event | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditEventSheet({ 
  event,
  open, 
  onOpenChange,
  onSuccess,
}: EditEventSheetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined)
  const [selectedParticipants, setSelectedParticipants] = useState<User[]>([])
  const supabase = createClientComponentClient()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      location: event?.location || "",
      dateRange: {
        from: event ? new Date(event.start_date) : new Date(),
        to: event?.end_date ? new Date(event.end_date) : undefined,
      },
      startTime: event?.start_time || undefined,
      isFullDay: !event?.start_time,
      participants: event?.participants.map(p => p.user.id) || [],
    },
  })

  useEffect(() => {
    if (event) {
      form.reset({
        title: event.title,
        description: event.description || "",
        location: event.location || "",
        dateRange: {
          from: new Date(event.start_date),
          to: event.end_date ? new Date(event.end_date) : undefined,
        },
        startTime: event.start_time || undefined,
        isFullDay: !event.start_time,
        participants: event.participants.map(p => p.user.id),
      })

      setSelectedParticipants(event.participants.map(p => ({
        id: p.user.id,
        name: p.user.name,
        avatar: p.user.avatar,
      })))
    }
  }, [event, form])

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
    if (!event) return

    setIsLoading(true)
    try {
      console.log('Début de la mise à jour...', values)

      // Mettre à jour l'événement
      const eventData = {
        title: values.title,
        description: values.description || null,
        location: values.location || null,
        start_date: format(values.dateRange.from, 'yyyy-MM-dd'),
        end_date: values.dateRange.to ? format(values.dateRange.to, 'yyyy-MM-dd') : format(values.dateRange.from, 'yyyy-MM-dd'),
        start_time: values.isFullDay ? null : (values.startTime || null),
        frequency: 'once',
      }

      console.log('Données de l\'événement à mettre à jour:', eventData)

      const { data: updatedEvent, error: eventError } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', event.id)
        .select()
        .single()

      if (eventError) {
        console.error('Erreur lors de la mise à jour de l\'événement:', eventError)
        throw eventError
      }

      console.log('Événement mis à jour:', updatedEvent)

      // Supprimer tous les participants existants
      const { error: deleteError } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', event.id)

      if (deleteError) {
        console.error('Erreur lors de la suppression des participants:', deleteError)
        throw deleteError
      }

      console.log('Participants existants supprimés')

      // Ajouter les nouveaux participants
      if (selectedParticipants.length > 0) {
        const participantsData = selectedParticipants.map(user => ({
          event_id: event.id,
          user_id: user.id,
        }))

        console.log('Ajout des nouveaux participants:', participantsData)

        const { data: newParticipants, error: participantsError } = await supabase
          .from('event_participants')
          .insert(participantsData)
          .select()

        if (participantsError) {
          console.error('Erreur lors de l\'ajout des participants:', participantsError)
          throw participantsError
        }

        console.log('Nouveaux participants ajoutés:', newParticipants)
      }

      console.log('Mise à jour terminée avec succès')
      if (onSuccess) onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      // Garder le sheet ouvert en cas d'erreur
      setIsLoading(false)
      return
    }
    
    setIsLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-[30%]">
        <SheetHeader className="px-6 py-6">
          <SheetTitle>Modifier l&apos;événement</SheetTitle>
          <SheetDescription>
            Modifiez les détails de votre événement
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 px-6 overflow-y-auto">
          <Form {...form}>
            <form 
              onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit(onSubmit)(e)
              }} 
              className="h-full flex flex-col"
            >
              <div className="flex-1 space-y-4">
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
                            form.setValue('participants', [...selectedParticipants.map(p => p.id), user.id])
                          }
                          setSelectedUser(undefined)
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner des participants" />
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
                                      <Image
                                        src={user.avatar}
                                        alt={user.name}
                                        className="h-4 w-4 rounded-full object-cover flex-shrink-0"
                                        width={16}
                                        height={16}
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

                {selectedParticipants.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedParticipants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5 text-xs"
                      >
                        {participant.avatar ? (
                          <Image
                            src={participant.avatar}
                            alt={participant.name}
                            className="h-4 w-4 rounded-full object-cover flex-shrink-0"
                            width={16}
                            height={16}
                          />
                        ) : (
                          <div className="h-4 w-4 rounded-full bg-background flex items-center justify-center text-[0.5rem] flex-shrink-0">
                            {participant.name[0]}
                          </div>
                        )}
                        <span className="truncate">{participant.name}</span>
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => {
                            setSelectedParticipants(selectedParticipants.filter(p => p.id !== participant.id))
                            form.setValue('participants', selectedParticipants.filter(p => p.id !== participant.id).map(p => p.id))
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 py-4 mt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Annuler
                </Button>
                <Button 
                  type="button"
                  onClick={() => {
                    const values = form.getValues();
                    console.log("Valeurs du formulaire:", values);
                    onSubmit(values);
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  )
} 