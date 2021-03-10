import {Model} from "./model/model.ts";

export interface PaginationRequest {
    limit?: number;
    offset?: number;
    pageSize?: number;
}

// TODO
export interface PaginationResponse<T extends Model> {
    total: number;
    items: T[];
}
