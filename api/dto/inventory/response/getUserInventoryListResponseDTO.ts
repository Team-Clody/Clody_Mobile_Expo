export interface UserInventoryItemResponseDTO {
  inventoryItemId: number;
  isEquipped: boolean;
  acquiredAt: string;
}

export interface GetUserInventoryListResponseDTO {
  inventories: UserInventoryItemResponseDTO[];
}
