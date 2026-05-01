import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { DashboardLayout, adminNavItems } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const TEMPLATE_COLUMNS = [
  'name', 'description', 'category_slug', 'unit_value', 'unit_type',
  'mrp', 'admin_selling_price', 'stock_quantity', 'max_order_quantity',
  'vendor_business_name', 'primary_image_url', 'status',
];

const TEMPLATE_EXAMPLE = {
  name: 'Aashirvaad Atta 5kg',
  description: 'Premium whole-wheat flour from selected grains',
  category_slug: 'flour-atta',
  unit_value: 5,
  unit_type: 'kg',
  mrp: 350,
  admin_selling_price: 295,
  stock_quantity: 50,
  max_order_quantity: 5,
  vendor_business_name: 'Ambur Farms',
  primary_image_url: 'https://example.com/image.jpg',
  status: 'active',
};

interface ParsedRow {
  rowIndex: number;
  raw: Record<string, any>;
  errors: string[];
  ready: any | null;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

const AdminBulkUpload: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>('');

  const { data: vendors = [] } = useQuery({
    queryKey: ['bulk-upload-vendors'],
    queryFn: async () => {
      const { data } = await supabase.from('vendors').select('id, business_name').eq('status', 'active' as any);
      return data || [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['bulk-upload-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, slug, name');
      return data || [];
    },
  });

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([TEMPLATE_EXAMPLE], { header: TEMPLATE_COLUMNS });

    // Column widths
    ws['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 22 }));

    XLSX.utils.book_append_sheet(wb, ws, 'Products');

    // Add a "ReadMe" sheet with field descriptions
    const readme = [
      ['Field', 'Required', 'Notes'],
      ['name', 'YES', 'Product display name'],
      ['description', 'no', 'Free text'],
      ['category_slug', 'YES', 'Must match an existing category slug exactly'],
      ['unit_value', 'no', 'Number, e.g. 5'],
      ['unit_type', 'no', 'kg, g, l, ml, piece, pack, dozen'],
      ['mrp', 'YES', 'Maximum retail price (₹)'],
      ['admin_selling_price', 'YES', 'Customer-facing price (₹). Leave empty and product stays hidden until admin sets later.'],
      ['stock_quantity', 'no', 'Default 0'],
      ['max_order_quantity', 'no', 'Default 10'],
      ['vendor_business_name', 'YES', 'Must match an existing active vendor exactly'],
      ['primary_image_url', 'no', 'Public URL'],
      ['status', 'no', 'active / inactive (default active)'],
    ];
    const wsReadMe = XLSX.utils.aoa_to_sheet(readme);
    wsReadMe['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsReadMe, 'ReadMe');

    XLSX.writeFile(wb, 'product_upload_template.xlsx');
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

    const vendorByName = new Map(vendors.map((v: any) => [String(v.business_name).trim().toLowerCase(), v]));
    const categoryBySlug = new Map(categories.map((c: any) => [String(c.slug).trim().toLowerCase(), c]));

    const out: ParsedRow[] = rows.map((raw, idx) => {
      const errors: string[] = [];
      const name = String(raw.name || '').trim();
      const mrp = Number(raw.mrp);
      const adminPrice = raw.admin_selling_price === '' || raw.admin_selling_price === null ? null : Number(raw.admin_selling_price);
      const vendorName = String(raw.vendor_business_name || '').trim().toLowerCase();
      const categorySlug = String(raw.category_slug || '').trim().toLowerCase();

      if (!name) errors.push('name required');
      if (!mrp || isNaN(mrp) || mrp <= 0) errors.push('mrp must be positive number');
      if (!vendorName) errors.push('vendor_business_name required');
      else if (!vendorByName.has(vendorName)) errors.push(`unknown vendor "${raw.vendor_business_name}"`);
      if (!categorySlug) errors.push('category_slug required');
      else if (!categoryBySlug.has(categorySlug)) errors.push(`unknown category_slug "${raw.category_slug}"`);
      if (adminPrice !== null && (isNaN(adminPrice) || adminPrice <= 0)) errors.push('admin_selling_price must be positive number');

      const vendor = vendorByName.get(vendorName) as any;
      const category = categoryBySlug.get(categorySlug) as any;

      const ready = errors.length === 0 ? {
        name,
        description: String(raw.description || '').trim() || null,
        category_id: category?.id,
        unit_value: raw.unit_value ? Number(raw.unit_value) : null,
        unit_type: raw.unit_type ? String(raw.unit_type).trim() : null,
        mrp,
        admin_selling_price: adminPrice,
        selling_price: adminPrice ?? mrp,
        stock_quantity: raw.stock_quantity ? Number(raw.stock_quantity) : 0,
        max_order_quantity: raw.max_order_quantity ? Number(raw.max_order_quantity) : 10,
        vendor_id: vendor?.id,
        primary_image_url: String(raw.primary_image_url || '').trim() || null,
        status: (String(raw.status || 'active').trim().toLowerCase() === 'inactive' ? 'inactive' : 'active'),
        sku: `${slugify(name)}-${Date.now().toString(36)}-${idx}`,
        slug: `${slugify(name)}-${Date.now().toString(36)}-${idx}`,
      } : null;

      return { rowIndex: idx + 2, raw, errors, ready };
    });

    setParsed(out);
  };

  const validRows = parsed.filter(r => r.errors.length === 0);
  const invalidRows = parsed.filter(r => r.errors.length > 0);

  const commitMutation = useMutation({
    mutationFn: async () => {
      const payload = validRows.map(r => r.ready).filter(Boolean);
      if (payload.length === 0) throw new Error('No valid rows to insert');
      const { error } = await supabase.from('products').insert(payload as any);
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: `Inserted ${count} products` });
      setParsed([]);
      setFileName('');
    },
    onError: (err: any) => {
      toast({ title: 'Insert failed', description: err.message || 'See console', variant: 'destructive' });
      console.error(err);
    },
  });

  return (
    <DashboardLayout title="Bulk Product Upload" navItems={adminNavItems} roleColor="bg-red-500 text-white" roleName="Admin Panel">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" /> Upload products from Excel
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm space-y-2">
            <div className="font-semibold">Step 1: Download the template</div>
            <p className="text-muted-foreground">
              The template has the exact columns required and a ReadMe sheet explaining each field.
            </p>
            <Button onClick={downloadTemplate} variant="outline" className="gap-2">
              <Download className="w-4 h-4" /> Download .xlsx template
            </Button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded p-4 text-sm space-y-2">
            <div className="font-semibold">Step 2: Upload your filled file</div>
            <p className="text-muted-foreground">Drop or click. We'll preview every row before inserting.</p>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <span className="bg-white border rounded px-4 py-2 text-sm font-medium hover:bg-gray-50 inline-flex items-center gap-2">
                <Upload className="w-4 h-4" /> Choose .xlsx file
              </span>
              {fileName && <span className="text-xs text-muted-foreground">{fileName}</span>}
            </label>
          </div>
        </CardContent>
      </Card>

      {parsed.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>Preview · {parsed.length} rows</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800" variant="secondary">
                  <CheckCircle className="w-3 h-3 mr-1" /> {validRows.length} valid
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge className="bg-red-100 text-red-800" variant="secondary">
                    <AlertTriangle className="w-3 h-3 mr-1" /> {invalidRows.length} with errors
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={() => { setParsed([]); setFileName(''); }}>
                  <X className="w-4 h-4 mr-1" /> Clear
                </Button>
                <Button
                  disabled={validRows.length === 0 || commitMutation.isPending}
                  onClick={() => commitMutation.mutate()}
                >
                  {commitMutation.isPending ? 'Inserting…' : `Insert ${validRows.length} products`}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">MRP</TableHead>
                    <TableHead className="text-right">Sell</TableHead>
                    <TableHead>Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.map((r) => (
                    <TableRow key={r.rowIndex} className={cn(r.errors.length > 0 && 'bg-red-50')}>
                      <TableCell className="text-xs">{r.rowIndex}</TableCell>
                      <TableCell>
                        {r.errors.length === 0 ? (
                          <Badge className="bg-green-100 text-green-800" variant="secondary">OK</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800" variant="secondary">Error</Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{r.raw.name || '-'}</TableCell>
                      <TableCell>{r.raw.vendor_business_name || '-'}</TableCell>
                      <TableCell>{r.raw.category_slug || '-'}</TableCell>
                      <TableCell className="text-right">{r.raw.mrp || '-'}</TableCell>
                      <TableCell className="text-right">{r.raw.admin_selling_price || '-'}</TableCell>
                      <TableCell className="text-xs text-red-700">
                        {r.errors.join('; ') || ''}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default AdminBulkUpload;
