import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Trash2, X, FolderEdit } from 'lucide-react';
import { useState } from 'react';
import { useAllExpenseCategories } from '@/hooks/useCustomCategories';

interface BulkActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkCategoryChange: (category: string) => void;
}

const formatCategoryName = (category: string) => {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function BulkActionsToolbar({ 
  selectedCount, 
  onClearSelection, 
  onBulkDelete,
  onBulkCategoryChange 
}: BulkActionsToolbarProps) {
  const { all: allCategories, custom: customCategories } = useAllExpenseCategories();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onBulkCategoryChange(category);
  };

  const handleDelete = () => {
    onBulkDelete();
    setShowDeleteDialog(false);
  };

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <div className="bg-card border border-border shadow-gold rounded-lg p-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="font-semibold">
              {selectedCount} selected
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border" />

          <div className="flex items-center gap-2">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px] h-9">
                <div className="flex items-center gap-2">
                  <FolderEdit className="h-4 w-4" />
                  <span>Change Category</span>
                </div>
              </SelectTrigger>
              <SelectContent>
                {allCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <div className="flex items-center gap-2">
                      {formatCategoryName(cat)}
                      {customCategories.includes(cat) && (
                        <Badge variant="secondary" className="text-xs">Custom</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} expenses?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedCount} {selectedCount === 1 ? 'expense' : 'expenses'}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete {selectedCount} {selectedCount === 1 ? 'Expense' : 'Expenses'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
