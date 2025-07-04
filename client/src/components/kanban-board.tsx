import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@shared/schema";
import { Plus, MoreHorizontal, Trash2 } from "lucide-react";
import type { Task, InsertTask } from "@shared/schema";
import { z } from "zod";

const taskFormSchema = insertTaskSchema.extend({
  dueDate: z.string().optional(),
});

export default function KanbanBoard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: InsertTask) => {
      const response = await apiRequest("POST", "/api/tasks", task);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task created successfully!" });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create task", variant: "destructive" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Task> }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("DELETE", `/api/tasks/${taskId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete task", variant: "destructive" });
    },
  });

  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "not_started",
      priority: "medium",
      dueDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = (values: z.infer<typeof taskFormSchema>) => {
    createTaskMutation.mutate(values);
  };

  const columns = [
    { id: 'not_started', title: 'Not Started', bgColor: 'bg-muted' },
    { id: 'started', title: 'Started', bgColor: 'bg-blue-50' },
    { id: 'progress', title: 'In Progress', bgColor: 'bg-yellow-50' },
    { id: 'completed', title: 'Completed', bgColor: 'bg-green-50' },
    { id: 'halted', title: 'Halted', bgColor: 'bg-red-50' },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-accent text-accent-foreground';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'progress': return 'bg-yellow-500 text-white';
      case 'started': return 'bg-primary text-primary-foreground';
      case 'halted': return 'bg-red-500 text-white';
      default: return 'bg-muted-foreground text-white';
    }
  };

  const handleStatusChange = (taskId: number, newStatus: string) => {
    updateTaskMutation.mutate({
      id: taskId,
      updates: { status: newStatus },
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Task Board</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground border-2 border-border hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-1" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="border-2 border-border">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
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
                        <Input placeholder="Enter task title" {...field} />
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
                        <Textarea placeholder="Enter task description" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    type="submit"
                    disabled={createTaskMutation.isPending}
                    className="flex-1"
                  >
                    Create Task
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
      
      <div className="overflow-x-auto kanban-scroll">
        <div className="flex space-x-4 min-w-max pb-4">
          {columns.map((column) => {
            const columnTasks = tasks.filter(task => task.status === column.id);
            
            return (
              <div key={column.id} className="w-64">
                <Card className="border-2 border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground">{column.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(column.id)}`}>
                        {columnTasks.length}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {columnTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`border-2 border-border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow ${column.bgColor}`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <h4 className={`font-medium text-foreground text-sm ${
                              task.status === 'completed' ? 'line-through' : ''
                            }`}>
                              {task.title}
                            </h4>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-auto p-1 -mt-1 -mr-1">
                                  <MoreHorizontal className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Trash2 className="w-3 h-3 mr-2" />
                                      Delete Task
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{task.title}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteTaskMutation.mutate(task.id)}
                                        disabled={deleteTaskMutation.isPending}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        {deleteTaskMutation.isPending ? "Deleting..." : "Delete"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(task.dueDate).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            )}
                          </div>
                          
                          {/* Status change buttons */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {task.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-6 px-2 bg-green-100 hover:bg-green-200 text-green-800"
                                onClick={() => handleStatusChange(task.id, 'completed')}
                              >
                                Complete
                              </Button>
                            )}
                            {task.status !== 'halted' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-6 px-2 bg-red-100 hover:bg-red-200 text-red-800"
                                onClick={() => handleStatusChange(task.id, 'halted')}
                              >
                                Halt
                              </Button>
                            )}
                            {task.status !== 'progress' && task.status !== 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-6 px-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                                onClick={() => handleStatusChange(task.id, 'progress')}
                              >
                                In Progress
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
