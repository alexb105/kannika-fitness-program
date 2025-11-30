"use client"

import { useState, useCallback, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useUserWeight, type WeightEntry } from "@/lib/hooks/use-user-weight"
import { useLanguage } from "@/lib/contexts/language-context"
import { Scale, TrendingUp, TrendingDown, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { formatDate } from "@/lib/date-utils"

export function WeightTracker() {
  const { weightEntries, loading, addWeightEntry, deleteWeightEntry, latestWeight, weightChange } = useUserWeight()
  const { t, language } = useLanguage()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [weight, setWeight] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState("")
  const [entryToDelete, setEntryToDelete] = useState<WeightEntry | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const weightNum = parseFloat(weight)
    if (isNaN(weightNum) || weightNum <= 0) {
      return
    }

    try {
      await addWeightEntry(weightNum, new Date(date), notes.trim() || undefined)
      setIsModalOpen(false)
      setWeight("")
      setNotes("")
      setDate(new Date().toISOString().split('T')[0])
    } catch (error) {
      console.error("Error submitting weight:", error)
    }
  }, [weight, date, notes, addWeightEntry])

  const handleDelete = useCallback(async () => {
    if (entryToDelete) {
      try {
        await deleteWeightEntry(entryToDelete.id)
        setIsDeleteDialogOpen(false)
        setEntryToDelete(null)
      } catch (error) {
        console.error("Error deleting weight entry:", error)
      }
    }
  }, [entryToDelete, deleteWeightEntry])

  // Prepare chart data (last 30 entries, sorted by date ascending)
  const chartData = useMemo(() => {
    const sorted = [...weightEntries]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(-30) // Last 30 entries
    
    return sorted.map((entry) => ({
      date: formatDate(entry.date),
      weight: Number(entry.weight), // Ensure weight is a number
      fullDate: entry.date.toISOString().split('T')[0],
    }))
  }, [weightEntries])

  const chartConfig = {
    weight: {
      label: "Weight",
      color: "hsl(221.2 83.2% 53.3%)", // Blue color that will work
    },
  }
  
  // Ensure we have at least 2 points to show a line, or show a single point
  const shouldShowChart = chartData.length > 0

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-sm text-muted-foreground">Loading weight data...</div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{t("weightTracking")}</h3>
          </div>
          <Button onClick={() => setIsModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {t("logWeight")}
          </Button>
        </div>

        {latestWeight ? (
          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold">{latestWeight.weight}</span>
              <span className="text-muted-foreground">{t("kg")}</span>
              {weightChange && (
                <div className={cn(
                  "flex items-center gap-1 text-sm",
                  weightChange.amount > 0 ? "text-destructive" : "text-green-600"
                )}>
                  {weightChange.amount > 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>
                    {weightChange.amount > 0 ? "+" : ""}
                    {weightChange.amount.toFixed(1)} {t("kg")}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("lastLogged")}: {formatDate(latestWeight.date)}
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Scale className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t("noWeightEntries")}</p>
            <p className="text-xs mt-1">{t("logFirstWeight")}</p>
          </div>
        )}
      </Card>

      {chartData.length > 0 && (
        <Card className="p-6">
          <h4 className="text-sm font-medium mb-4">{t("weightProgress")}</h4>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <LineChart 
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                domain={['dataMin - 2', 'dataMax + 2']}
                stroke="#6b7280"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 5, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                connectNulls={false}
                isAnimationActive={true}
              />
            </LineChart>
          </ChartContainer>
        </Card>
      )}

      {weightEntries.length > 0 && (
        <Card className="p-6">
          <h4 className="text-sm font-medium mb-4">{t("recentEntries")}</h4>
          <div className="space-y-2">
            {weightEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{entry.weight} {t("kg")}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setEntryToDelete(entry)
                    setIsDeleteDialogOpen(true)
                  }}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add/Edit Weight Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("logWeight")}</DialogTitle>
            <DialogDescription>{t("logWeightDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="weight">{t("weight")} ({t("kg")})</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70.5"
                required
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="date">{t("date")}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="mt-2"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="notes">{t("notes")}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("optionalNotes")}
                className="mt-2"
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">
                {t("cancel")}
              </Button>
              <Button type="submit" className="flex-1">
                {t("save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteWeightEntry")}?</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteWeightEntryDescription")}
              {entryToDelete && (
                <span className="block mt-2 font-medium">
                  {entryToDelete.weight} {t("kg")} - {formatDate(entryToDelete.date)}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

