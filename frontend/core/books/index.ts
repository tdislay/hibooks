import {
  GetBookRequest,
  GetBookResponse,
  SearchBookResponse,
  SearchBooksRequest,
} from "backend";
import { ApiResponse, api } from "../api";

export async function searchBooks(
  query?: SearchBooksRequest["query"],
): Promise<ApiResponse<SearchBookResponse>> {
  return api.get<SearchBooksRequest, SearchBookResponse>("/books", {
    query,
  });
}

export async function getBook(
  id: number,
): Promise<ApiResponse<GetBookResponse>> {
  return api.get<GetBookRequest, GetBookResponse>(`/books/${id}`);
}
