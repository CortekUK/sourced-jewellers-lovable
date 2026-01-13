import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Product } from '@/types';
import { Package, PoundSterling, TrendingUp, Calendar, Truck, Tag, Gem, Award, FileText, Eye, Download, Repeat, User, Phone, Copy, ExternalLink, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ConsignmentAgreementSection } from '@/components/consignments/ConsignmentAgreementSection';
import { StockAdjustmentModal } from '@/components/products/StockAdjustmentModal';
import { ImageModal } from '@/components/ui/image-modal';
import { ProductDocumentsTab } from '@/components/documents/ProductDocumentsTab';
import { PartExchangeInfoTab } from '@/components/products/PartExchangeInfoTab';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOwnerGuard } from '@/hooks/useOwnerGuard';
import { useToast } from '@/hooks/use-toast';
import { useProductTradeInStatus } from '@/hooks/useProductTradeInStatus';
import { usePartExchangesByProduct } from '@/hooks/usePartExchanges';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { getSupplierDisplayName, getCleanedDescription, formatCurrency } from '@/lib/utils';

interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClick: () => void;
  onDuplicateClick?: () => void;
  soldInfo?: {
    soldAt: string;
    salePrice: number;
    saleId: number;
  };
}

export function ProductDetailModal({ product, open, onOpenChange, onEditClick, onDuplicateClick, soldInfo }: ProductDetailModalProps) {
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const navigate = useNavigate();
  const isOwner = useOwnerGuard();
  const { toast } = useToast();

  // Check product type status
  const { data: isTradeIn } = useProductTradeInStatus(product?.id || 0);
  const { data: partExchange } = usePartExchangesByProduct(product?.id || 0);

  // Keyboard shortcut for duplicate (Cmd/Ctrl + D)
  useKeyboardShortcuts([
    {
      key: 'd',
      ctrlKey: true,
      callback: () => {
        if (isOwner && onDuplicateClick && open) {
          onDuplicateClick();
        }
      },
      description: 'Duplicate Product (Cmd/Ctrl+D)'
    }
  ]);

  if (!product) return null;

  const stock = (product as any).qty_on_hand || 0;
  const inventoryValue = (product as any).inventory_value || 0;
  const profit = (Number(product.unit_price) - Number(product.unit_cost)).toFixed(2);
  const margin = Number(product.unit_price) > 0 
    ? (((Number(product.unit_price) - Number(product.unit_cost)) / Number(product.unit_price)) * 100).toFixed(1)
    : 0;
  
  const getStockStatus = (qty: number) => {
    if (qty === 0) return { variant: 'destructive' as const, text: 'Out of Stock', color: 'text-destructive' };
    if (qty < 5) return { variant: 'secondary' as const, text: 'Low Stock', color: 'text-warning' };
    return { variant: 'outline' as const, text: 'In Stock', color: 'text-success' };
  };
  
  const stockStatus = getStockStatus(stock);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`w-full max-w-[58rem] max-h-[90vh] overflow-y-auto p-4 md:p-6 ${soldInfo ? 'border-destructive/50' : ''}`}>
          <DialogHeader className={soldInfo ? 'pt-2' : ''}>
            {soldInfo && (
              <div className="mb-4 p-3 md:p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="destructive" className="text-base px-3 py-1">
                      SOLD
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">
                        Sold on {format(new Date(soldInfo.soldAt), 'MMM dd, yyyy')} for £{soldInfo.salePrice.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This product has been sold and is archived
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/sales/transactions?sale=${soldInfo.saleId}`)}
                    className="gap-2 shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Sale
                  </Button>
                </div>
              </div>
            )}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {(product as any).image_url ? (
                  <img
                    src={(product as any).image_url}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setImageModalOpen(true)}
                  />
                ) : (
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <DialogTitle className="font-luxury text-2xl text-foreground mb-2">{product.name}</DialogTitle>
                      <p className="text-muted-foreground font-sans">
                        {product.category} • SKU: {product.internal_sku || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!soldInfo && (
                        <Badge variant={stockStatus.variant}>
                          {stockStatus.text}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Product Type Badges */}
                  <div className="flex items-center gap-2 mt-3">
                    {(product as any).is_registered && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 font-medium">
                        <Award className="h-3 w-3 mr-1" />
                        Registered
                      </Badge>
                    )}
                    {(product as any).is_consignment && (
                      <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-900/20 font-medium">
                        <FileText className="h-3 w-3 mr-1" />
                        Consignment
                      </Badge>
                    )}
                    {isTradeIn && (
                      <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50 dark:bg-blue-900/20 font-medium">
                        <Repeat className="h-3 w-3 mr-1" />
                        Part Exchange
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          {/* Financial Highlights Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="shadow-sm border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PoundSterling className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground font-sans">Sell Price</span>
                </div>
                <p className="text-2xl font-luxury text-primary">£{Number(product.unit_price).toFixed(2)}</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-sans">Profit</span>
                </div>
                <p className={`text-2xl font-luxury ${Number(profit) >= 0 ? 'text-success' : 'text-destructive'}`}>
                  £{profit} ({margin}%)
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-sans">Stock</span>
                </div>
                <p className={`text-2xl font-luxury ${stockStatus.color}`}>{stock}</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PoundSterling className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground font-sans">Inventory Value</span>
                </div>
                <p className="text-2xl font-luxury text-foreground">£{inventoryValue.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Purchase Tracking Section - Hide if sold */}
          {stock > 0 && !soldInfo && (
            <Card className="shadow-sm mb-6 border-primary/20">
              <CardHeader>
                <CardTitle className="font-luxury text-lg text-foreground flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Purchase & Inventory Age
                </CardTitle>
                <CardDescription className="font-sans">
                  Inventory tracking and aging information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Purchase Date</p>
                    <p className="font-medium">{(product as any).purchase_date 
                      ? new Date((product as any).purchase_date).toLocaleDateString('en-GB')
                      : new Date((product as any).created_at).toLocaleDateString('en-GB')}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(product as any).purchase_date 
                        ? new Date((product as any).purchase_date).toLocaleDateString('en-GB', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : new Date((product as any).created_at).toLocaleDateString('en-GB', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Days in Inventory</p>
                    <p className="font-luxury text-2xl font-bold text-primary">
                      {(() => {
                        const purchaseDate = (product as any).purchase_date 
                          ? new Date((product as any).purchase_date)
                          : new Date((product as any).created_at);
                        return Math.floor((new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
                      })()}
                    </p>
                    <Badge 
                      variant={
                        (() => {
                          const purchaseDate = (product as any).purchase_date 
                            ? new Date((product as any).purchase_date)
                            : new Date((product as any).created_at);
                          const days = Math.floor((new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
                          return days >= 90 ? 'destructive' : days >= 60 ? 'secondary' : 'outline';
                        })()
                      }
                      className="mt-1 text-xs"
                    >
                      {(() => {
                        const purchaseDate = (product as any).purchase_date 
                          ? new Date((product as any).purchase_date)
                          : new Date((product as any).created_at);
                        const days = Math.floor((new Date().getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
                        return days >= 90 ? 'Aged Stock' : days >= 60 ? 'Aging' : 'Fresh';
                      })()}
                    </Badge>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Cost vs. Value</p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Cost: </span>
                      <span className="font-medium">{formatCurrency(Number((product as any).unit_cost))}</span>
                    </p>
                    <p className="text-sm mt-1">
                      <span className="text-muted-foreground">Value: </span>
                      <span className="font-medium">{formatCurrency(inventoryValue)}</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ownership Source Section */}
          {((product as any).is_consignment || isTradeIn || getSupplierDisplayName(product) !== 'Unknown Supplier') && (
            <Card className="shadow-sm mb-6">
              <CardHeader>
                <CardTitle className="font-luxury text-lg text-foreground">
                  Ownership Source
                </CardTitle>
                <CardDescription className="font-sans">
                  {(product as any).is_consignment 
                    ? "Consignment product details"
                    : isTradeIn 
                      ? "Part exchange customer information"
                      : "Supplier information"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(product as any).is_consignment ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-sans">Consignment Supplier:</span>
                        <span className="font-medium">
                          {(product as any).consignment_supplier?.name || 'N/A'}
                        </span>
                      </div>
                      {(product as any).consignment_start_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-sans">Start Date:</span>
                          <span className="font-medium">
                            {new Date((product as any).consignment_start_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {(product as any).consignment_end_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-sans">End Date:</span>
                          <span className="font-medium">
                            {new Date((product as any).consignment_end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {(product as any).consignment_terms && (
                      <div>
                        <span className="text-muted-foreground font-sans">Terms:</span>
                        <p className="mt-1 text-sm">{(product as any).consignment_terms}</p>
                      </div>
                    )}
                  </div>
                ) : isTradeIn && partExchange ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2 font-sans">
                        <User className="h-4 w-4" />
                        Customer Details
                      </h4>
                      <div className="space-y-2 pl-6">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-sans">Name:</span>
                          <span className="font-medium">
                            {partExchange.customer_name || 'Not recorded'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-sans">Contact:</span>
                          <span className="font-medium font-mono">
                            {partExchange.customer_contact || 'Not recorded'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2 font-sans">
                        <PoundSterling className="h-4 w-4" />
                        Trade-In Details
                      </h4>
                      <div className="space-y-2 pl-6">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground font-sans">Allowance:</span>
                          <span className="font-medium text-success">
                            {formatCurrency(Number(partExchange.allowance))}
                          </span>
                        </div>
                        {partExchange.sale?.sold_at && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground font-sans">Date:</span>
                            <span className="font-medium">
                              {new Date(partExchange.sale.sold_at).toLocaleDateString('en-GB')}
                            </span>
                          </div>
                        )}
                        {partExchange.sale_id && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/sales/${partExchange.sale_id}`);
                              onOpenChange(false);
                            }}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Original Sale
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground font-sans">Supplier:</span>
                    <span className="font-medium">
                      {getSupplierDisplayName(product)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Collapsible Sections */}
          <Accordion type="multiple" defaultValue={["pricing", "specifications"]} className="space-y-4">
            
            {/* Pricing & Financials */}
            <AccordionItem value="pricing" className="border border-border border-b-0 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <PoundSterling className="h-4 w-4 text-primary" />
                  <span className="font-luxury text-lg">Pricing & Financials</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Cost Price:</span>
                    <span className="font-medium">£{Number(product.unit_cost).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Sell Price:</span>
                    <span className="font-medium">£{Number(product.unit_price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Profit per Unit:</span>
                    <span className={`font-medium ${Number(profit) >= 0 ? 'text-success' : 'text-destructive'}`}>£{profit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Margin:</span>
                    <span className="font-medium">{margin}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Tax Rate:</span>
                    <span className="font-medium">{Number(product.tax_rate || 0).toFixed(1)}%</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Specifications */}
            <AccordionItem value="specifications" className="border border-border border-b-0 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <Gem className="h-4 w-4 text-primary" />
                  <span className="font-luxury text-lg">Specifications</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Internal SKU:</span>
                    <span className="font-medium font-mono">{product.internal_sku}</span>
                  </div>
                  {product.sku && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-sans">SKU:</span>
                      <span className="font-medium font-mono">{product.sku}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-sans">Category:</span>
                    <span className="font-medium">{product.category || 'N/A'}</span>
                  </div>
                  {product.metal && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-sans">Metal:</span>
                      <span className="font-medium">{product.metal}</span>
                    </div>
                  )}
                  {product.karat && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-sans">Karat/Purity:</span>
                      <span className="font-medium">{product.karat}</span>
                    </div>
                  )}
                  {product.gemstone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-sans">Gemstone:</span>
                      <span className="font-medium">{product.gemstone}</span>
                    </div>
                  )}
                  {(product as any).location && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-sans flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Location:
                      </span>
                      <span className="font-medium">{(product as any).location.name}</span>
                    </div>
                  )}
                </div>
                {getCleanedDescription(product.description) && (
                  <div className="mt-4 pt-4 border-t">
                    <span className="text-muted-foreground font-sans">Description:</span>
                    <p className="mt-1 text-sm font-sans">{getCleanedDescription(product.description)}</p>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Stock Management - Owner only */}
            {isOwner && (
              <AccordionItem value="stock" className="border border-border border-b-0 rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="font-luxury text-lg">Stock Management</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="font-medium font-sans">
                        Current Stock: <span className={stockStatus.color}>{stock} units</span>
                      </p>
                      <p className="text-sm text-muted-foreground font-sans">
                        Inventory Value: £{inventoryValue.toFixed(2)}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setStockModalOpen(true)}
                      className="ml-4"
                    >
                      Adjust Stock
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Documents & Media */}
            <AccordionItem value="documents" className="border border-border border-b-0 rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-luxury text-lg">Documents & Media</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="pt-2">
                  <ProductDocumentsTab productId={product.id} />
                  
                  {/* Consignment Agreements - if applicable */}
                  {(product as any).is_consignment && (
                    <div className="mt-6">
                      <ConsignmentAgreementSection 
                        productId={product.id} 
                        isConsignment={true}
                      />
                    </div>
                  )}

                  {/* Trade-in Notes - if applicable */}
                  {isTradeIn && partExchange?.notes && (
                    <Card className="mt-6 border-blue-200 bg-blue-50/50 dark:bg-blue-900/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base text-blue-800 dark:text-blue-200">
                          <Repeat className="h-4 w-4" />
                          Trade-In Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm font-sans">{partExchange.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            
          </Accordion>

          {/* Action Buttons - Hide when viewing sold items */}
          {!soldInfo && (
            <div className="flex gap-2 pt-6 border-t mt-6">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Close
              </Button>
              {isOwner && (
                <>
                  {onDuplicateClick && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              onOpenChange(false);
                              onDuplicateClick();
                            }}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Duplicate this product (Cmd/Ctrl+D)</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <Button onClick={onEditClick} className="flex-1">
                    Edit Product
                  </Button>
                </>
              )}
            </div>
          )}

        </DialogContent>
      </Dialog>

      <StockAdjustmentModal
        product={product}
        open={stockModalOpen}
        onOpenChange={setStockModalOpen}
      />

      {(product as any)?.image_url && (
        <ImageModal
          src={(product as any).image_url}
          alt={product.name}
          open={imageModalOpen}
          onOpenChange={setImageModalOpen}
        />
      )}
    </>
  );
}