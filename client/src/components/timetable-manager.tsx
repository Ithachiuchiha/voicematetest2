import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertScheduleItemSchema } from "@shared/schema";
import { Plus, Edit3 } from "lucide-react";
import type { ScheduleItem, InsertScheduleItem } from "@shared/schema";

export default function TimetableManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scheduleItems = [], isLoading } = useQuery<ScheduleItem[]>({
    queryKey: ["/api/schedule"],
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (item: InsertScheduleItem) => {
      const response = await apiRequest("POST", "/api/schedule", item);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
      toast({ title: "Schedule item created successfully!" });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create schedule item", variant: "destructive" });
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<ScheduleItem> }) => {
      const response = await apiRequest("PATCH", `/api/schedule/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
      toast({ title: "Schedule item updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update schedule item", variant: "destructive" });
    },
  });

  const form = useForm<InsertScheduleItem>({
    resolver: zodResolver(insertScheduleItemSchema),
    defaultValues: {
      title: "",
      description: "",
      time: "09:00",
      repeatPattern: "daily",
      isActive: true,
      color: "#FF69B4",
    },
  });

  const onSubmit = (values: InsertScheduleItem) => {
    createScheduleMutation.mutate(values);
  };

  const toggleActiveStatus = (itemId: number, isActive: boolean) => {
    updateScheduleMutation.mutate({
      id: itemId,
      updates: { isActive },
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getRepeatLabel = (pattern: string) => {
    switch (pattern) {
      case 'daily': return 'Daily';
      case 'weekdays': return 'Mon-Fri';
      case 'weekends': return 'Weekends';
      default: return pattern;
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading schedule...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-2 border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Daily Schedule</h2>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground border-2 border-border hover:bg-accent/90">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="border-2 border-border">
                <DialogHeader>
                  <DialogTitle>Create Schedule Item</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter title" {...field} />
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="repeatPattern"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Repeat</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select pattern" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekdays">Weekdays</SelectItem>
                                <SelectItem value="weekends">Weekends</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color</FormLabel>
                          <FormControl>
                            <Input type="color" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex space-x-2">
                      <Button
                        type="submit"
                        disabled={createScheduleMutation.isPending}
                        className="flex-1"
                      >
                        Create Item
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
          
          {scheduleItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No schedule items. Create your first one!
            </div>
          ) : (
            <div className="space-y-4">
              {scheduleItems.map((item) => (
                <div key={item.id} className="bg-muted border-2 border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-medium text-foreground text-sm">
                        {formatTime(item.time)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.isActive ? 'Active' : 'Paused'}
                      </span>
                      <Button variant="ghost" size="sm" className="h-auto p-1">
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      <Switch
                        checked={item.isActive}
                        onCheckedChange={(checked) => toggleActiveStatus(item.id, checked)}
                      />
                    </div>
                  </div>
                  <h3 className="font-medium text-foreground mb-1">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                  )}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Repeat:</span>
                    <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
                      {getRepeatLabel(item.repeatPattern)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
