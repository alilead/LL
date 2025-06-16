import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsAPI, Tag } from '@/services/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/Badge';
import { Trash2, Edit, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';

const TagManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);

  // Organizasyonları getir
  const { data: organizations = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/organizations');
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error('Error fetching organizations:', error);
        return [];
      }
    },
  });

  // Fetch all tags
  const { data: tagsData = [], isLoading: isTagsLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      try {
        const response = await tagsAPI.getAll();
        setTags(response.data);
        return response.data || [];
      } catch (error) {
        console.error('Error fetching tags:', error);
        return [];
      }
    },
  });

  // Create new tag
  const createTagMutation = useMutation({
    mutationFn: (data: { name: string }) => {
      return tagsAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag created successfully');
      setIsCreateDialogOpen(false);
      setNewTagName('');
    },
    onError: (error) => {
      toast.error(`Failed to create tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Update tag
  const updateTagMutation = useMutation({
    mutationFn: (data: { id: number; name: string }) => {
      return tagsAPI.update(data.id, { name: data.name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag updated successfully');
      setIsEditDialogOpen(false);
      setEditingTag(null);
    },
    onError: (error) => {
      toast.error(`Failed to update tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Delete tag
  const deleteTagMutation = useMutation({
    mutationFn: (id: number) => {
      return tagsAPI.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      toast.success('Tag deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete tag: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  const handleCreateTag = () => {
    if (!newTagName.trim()) {
      toast.error('Tag name cannot be empty');
      return;
    }

    createTagMutation.mutate({
      name: newTagName.trim(),
    });
  };

  const handleUpdateTag = () => {
    if (!editingTag) return;
    if (!editingTag.name.trim()) {
      toast.error('Tag name cannot be empty');
      return;
    }

    updateTagMutation.mutate({
      id: editingTag.id,
      name: editingTag.name.trim(),
    });
  };

  const handleDeleteTag = () => {
    if (!selectedTagId) return;

    deleteTagMutation.mutate(selectedTagId);
    setIsDeleteDialogOpen(false);
  };

  const openEditDialog = (tag: Tag) => {
    setEditingTag({ ...tag });
    setIsEditDialogOpen(true);
  };

  // Organizasyon adını bul
  const getOrganizationName = (orgId: number) => {
    const org = organizations.find((o: any) => o.id === orgId);
    return org ? org.name : `Organization ID: ${orgId}`;
  };

  // Tarihi formatlama
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isTagsLoading) {
    return <div className="flex justify-center p-8">Loading tags...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tag Management</h1>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create New Tag
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tags</CardTitle>
        </CardHeader>
        <CardContent>
          {Array.isArray(tags) && tags.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag: Tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <Badge>
                        {tag.name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tag.organization_name || getOrganizationName(tag.organization_id)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => openEditDialog(tag)}
                        className="mr-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSelectedTagId(tag.id);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4">
              No tags found. Create your first tag to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Tag Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tagName">Tag Name</Label>
              <Input
                id="tagName"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Enter tag name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTag} disabled={createTagMutation.isPending}>
              {createTagMutation.isPending ? 'Creating...' : 'Create Tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          {editingTag && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editTagName">Tag Name</Label>
                <Input
                  id="editTagName"
                  value={editingTag.name}
                  onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                  placeholder="Enter tag name"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTag} disabled={updateTagMutation.isPending}>
              {updateTagMutation.isPending ? 'Updating...' : 'Update Tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tag Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p>Are you sure you want to delete this tag? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTag}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagManagement;
