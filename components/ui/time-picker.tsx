"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

export interface TimePickerProps {
  value?: string
  onChange?: (time: string) => void
  className?: string
}

export function TimePicker({
  value,
  onChange,
  className,
}: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [hours, setHours] = React.useState(value?.split(":")[0] || "")
  const [minutes, setMinutes] = React.useState(value?.split(":")[1] || "")

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
    if (val === "") {
      setHours("")
      return
    }
    
    const num = parseInt(val)
    if (isNaN(num)) return
    if (num < 0) val = "0"
    if (num > 23) val = "23"
    
    setHours(val.padStart(2, "0"))
    if (val.length === 2 && minutes) {
      const newTime = `${val.padStart(2, "0")}:${minutes}`
      onChange?.(newTime)
    }
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
    if (val === "") {
      setMinutes("")
      return
    }
    
    const num = parseInt(val)
    if (isNaN(num)) return
    if (num < 0) val = "0"
    if (num > 59) val = "59"
    
    setMinutes(val.padStart(2, "0"))
    if (val.length === 2 && hours) {
      const newTime = `${hours}:${val.padStart(2, "0")}`
      onChange?.(newTime)
    }
  }

  const handleQuickSelect = (hour: number) => {
    const newHours = hour.toString().padStart(2, "0")
    const newMinutes = "00"
    setHours(newHours)
    setMinutes(newMinutes)
    onChange?.(`${newHours}:${newMinutes}`)
    setIsOpen(false)
  }

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(":")
      setHours(h)
      setMinutes(m)
    }
  }, [value])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? `${hours}:${minutes}` : "Sélectionner une heure"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="flex gap-2 items-center mb-4">
          <div className="grid gap-1">
            <Input
              type="text"
              value={hours}
              onChange={handleHoursChange}
              className="w-[4ch] text-center"
              placeholder="HH"
              maxLength={2}
            />
          </div>
          <span className="text-muted-foreground">:</span>
          <div className="grid gap-1">
            <Input
              type="text"
              value={minutes}
              onChange={handleMinutesChange}
              className="w-[4ch] text-center"
              placeholder="MM"
              maxLength={2}
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((hour) => (
            <Button
              key={hour}
              variant="outline"
              className="text-xs"
              onClick={() => handleQuickSelect(hour)}
            >
              {hour}:00
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
} 