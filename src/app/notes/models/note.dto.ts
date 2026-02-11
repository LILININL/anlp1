export interface NoteDto {
    id: number;
    user_id: number;
    product_id: number | null;
    title: string;
    body: string | null;
    status: 'open' | 'in_progress' | 'done' | string;
    created_at: string;
    updated_at: string;
}

export interface NoteProductsDto {
    name: string | null;
    price: number | null;
    sku: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface NoteWithProductDto {
    note: NoteDto;
    product: NoteProductsDto | null;
}

export interface NoteWithProductApi extends NoteDto {
    product_name?: string | null;
    product_sku?: string | null;
    product_price?: number | null;
    product_created_at?: string | null;
    product_updated_at?: string | null;
}
