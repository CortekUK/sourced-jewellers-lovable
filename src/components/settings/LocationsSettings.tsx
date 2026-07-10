import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from '@/hooks/useLocations';
import { Plus, Edit, Trash2, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import type { Location } from '@/types';

const locationSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  legal_name: z.string().max(150, "Legal name must be less than 150 characters").optional(),
  address: z.string().max(500, "Address must be less than 500 characters").optional(),
  phone: z.string().max(50, "Phone must be less than 50 characters").optional(),
  email: z.string().email("Enter a valid email").max(150).optional().or(z.literal('')),
  currency: z.enum(["GBP", "AED"]),
  status: z.enum(["active", "inactive"])
});

export function LocationsSettings() {
  const { data: locations, isLoading } = useLocations();
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    address: '',
    phone: '',
    email: '',
    currency: 'GBP' as 'GBP' | 'AED',
    status: 'active' as 'active' | 'inactive'
  });

  const resetForm = () => {
    setFormData({ name: '', legal_name: '', address: '', phone: '', email: '', currency: 'GBP', status: 'active' });
    setValidationErrors({});
  };

  const handleAddOpen = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleEditOpen = (location: Location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      legal_name: location.legal_name || '',
      address: location.address || '',
      phone: location.phone || '',
      email: location.email || '',
      currency: (location.currency as 'GBP' | 'AED') || 'GBP',
      status: location.status as 'active' | 'inactive'
    });
    setValidationErrors({});
    setIsEditOpen(true);
  };

  const handleDeleteOpen = (location: Location) => {
    setSelectedLocation(location);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    try {
      locationSchema.parse(formData);
      setValidationErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) {
            errors[e.path[0] as string] = e.message;
          }
        });
        setValidationErrors(errors);
      }
      return false;
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    createMutation.mutate(formData, {
      onSuccess: () => {
        setIsAddOpen(false);
        resetForm();
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedLocation) return;

    updateMutation.mutate({ id: selectedLocation.id, ...formData }, {
      onSuccess: () => {
        setIsEditOpen(false);
        setSelectedLocation(null);
        resetForm();
      }
    });
  };

  const handleDelete = () => {
    if (!selectedLocation) return;

    deleteMutation.mutate(selectedLocation.id, {
      onSuccess: () => {
        setIsDeleteOpen(false);
        setSelectedLocation(null);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>
              Store Locations
            </CardTitle>
            <CardDescription>
              Manage your store locations for product inventory tracking.
            </CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleAddOpen} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-luxury">Add Location</DialogTitle>
                <DialogDescription>Create a new location for your inventory</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Main Store, Warehouse A"
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legal_name">Legal / receipt name</Label>
                  <Input
                    id="legal_name"
                    value={formData.legal_name}
                    onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    placeholder="e.g. SOURCED WRISTS WATCHES TRADING LLC"
                  />
                  <p className="text-xs text-muted-foreground">
                    Printed on this location's receipts. Leave blank to use the default store name.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <AddressAutocomplete
                    value={formData.address}
                    onChange={(value) => setFormData({ ...formData, address: value })}
                    placeholder="Start typing an address..."
                  />
                  {validationErrors.address && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.address}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+44 …"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="store@…"
                    />
                    {validationErrors.email && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {validationErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value as 'GBP' | 'AED' })}
                  >
                    <SelectTrigger id="currency" className="sm:w-1/2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">£ GBP</SelectItem>
                      <SelectItem value="AED">AED</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Used for this location's cash drawer and receipts.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="status"
                    checked={formData.status === 'active'}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, status: checked ? 'active' : 'inactive' })
                    }
                  />
                  <Label htmlFor="status">Active</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Add Location
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !locations || locations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="mb-2">No locations added yet</p>
            <p className="text-sm">Add your first location to start tracking product inventory by location.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map((location) => (
                  <TableRow key={location.id}>
                    <TableCell className="font-medium">{location.name}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">
                      {location.address || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={location.status === 'active' ? 'default' : 'secondary'}>
                        {location.status === 'active' ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditOpen(location)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteOpen(location)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-luxury">Edit Location</DialogTitle>
              <DialogDescription>Update location information</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Location name"
                />
                {validationErrors.name && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-legal_name">Legal / receipt name</Label>
                <Input
                  id="edit-legal_name"
                  value={formData.legal_name}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                  placeholder="e.g. SOURCED WRISTS WATCHES TRADING LLC"
                />
                <p className="text-xs text-muted-foreground">
                  Printed on this location's receipts. Leave blank to use the default store name.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(value) => setFormData({ ...formData, address: value })}
                  placeholder="Start typing an address..."
                />
                {validationErrors.address && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationErrors.address}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+44 …"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="store@…"
                  />
                  {validationErrors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {validationErrors.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value as 'GBP' | 'AED' })}
                >
                  <SelectTrigger id="edit-currency" className="sm:w-1/2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP">£ GBP</SelectItem>
                    <SelectItem value="AED">AED</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used for this location's cash drawer and receipts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="edit-status"
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, status: checked ? 'active' : 'inactive' })
                  }
                />
                <Label htmlFor="edit-status">Active</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Location</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedLocation?.name}"?
                Products assigned to this location will have their location cleared.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
