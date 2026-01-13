import { FileText, Shield, Award, Wrench, Camera, File, CreditCard } from 'lucide-react';
import { DocumentType } from '@/hooks/useProductDocuments';

interface DocumentTypeIconProps {
  type: DocumentType;
  className?: string;
}

export function DocumentTypeIcon({ type, className = "h-4 w-4" }: DocumentTypeIconProps) {
  switch (type) {
    case 'registration':
      return <FileText className={className} />;
    case 'warranty':
      return <Shield className={className} />;
    case 'appraisal':
      return <Award className={className} />;
    case 'service':
      return <Wrench className={className} />;
    case 'photo':
      return <Camera className={className} />;
    case 'certificate_card':
      return <CreditCard className={className} />;
    case 'consignment_agreement':
      return <FileText className={className} />;
    case 'other':
    default:
      return <File className={className} />;
  }
}

export function getDocumentTypeLabel(type: DocumentType): string {
  switch (type) {
    case 'registration':
      return 'Registration';
    case 'warranty':
      return 'Warranty';
    case 'appraisal':
      return 'Appraisal';
    case 'service':
      return 'Service';
    case 'photo':
      return 'Photo';
    case 'certificate_card':
      return 'Certificate Card';
    case 'consignment_agreement':
      return 'Consignment Agreement';
    case 'other':
      return 'Other';
    default:
      return 'Document';
  }
}

export function getDocumentTypeColor(type: DocumentType): string {
  switch (type) {
    case 'registration':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'warranty':
      return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
    case 'appraisal':
      return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800';
    case 'service':
      return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800';
    case 'photo':
      return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
    case 'certificate_card':
      return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800';
    case 'consignment_agreement':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800';
    case 'other':
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  }
}