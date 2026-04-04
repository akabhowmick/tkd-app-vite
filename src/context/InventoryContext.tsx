import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import {
  InventoryItemWithAlert,
  InventoryTransaction,
  CreateInventoryItemRequest,
  CreateTransactionRequest,
  UpdateInventoryItemRequest,
} from "../types/inventory";
import {
  getInventoryItems,
  getLowStockItems,
  createInventoryItem as apiCreateInventoryItem,
  updateInventoryItem as apiUpdateInventoryItem,
  deleteInventoryItem as apiDeleteInventoryItem,
  getTransactions,
  createTransaction as apiCreateTransaction,
  deleteTransaction as apiDeleteTransaction,
} from "../api/InventoryRequests/inventoryRequests";
import { useSchool } from "./SchoolContext";

interface InventoryContextType {
  items: InventoryItemWithAlert[];
  lowStockItems: InventoryItemWithAlert[];
  transactions: InventoryTransaction[];
  loading: boolean;
  error: string | null;
  loadItems: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  createItem: (data: Omit<CreateInventoryItemRequest, "school_id">) => Promise<void>;
  updateItem: (itemId: string, updates: UpdateInventoryItemRequest) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  recordTransaction: (data: Omit<CreateTransactionRequest, "school_id">) => Promise<void>;
  deleteTransactionRecord: (transactionId: string) => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider = ({ children }: { children: ReactNode }) => {
  const { schoolId } = useSchool();
  const [items, setItems] = useState<InventoryItemWithAlert[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItemWithAlert[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    if (!schoolId) return;

    try {
      setLoading(true);
      setError(null);
      const [allItems, lowStock] = await Promise.all([
        getInventoryItems(schoolId),
        getLowStockItems(schoolId),
      ]);
      setItems(allItems);
      setLowStockItems(lowStock);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load inventory";
      setError(message);
      console.error("Error loading inventory:", err);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const loadTransactions = useCallback(async () => {
    if (!schoolId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getTransactions(schoolId);
      setTransactions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load transactions";
      setError(message);
      console.error("Error loading transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const createItem = useCallback(
    async (data: Omit<CreateInventoryItemRequest, "school_id">): Promise<void> => {
      if (!schoolId) throw new Error("School ID required");

      try {
        setLoading(true);
        setError(null);
        await apiCreateInventoryItem({ ...data, school_id: schoolId });
        await loadItems();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create item";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [schoolId, loadItems]
  );

  const updateItem = useCallback(
    async (itemId: string, updates: UpdateInventoryItemRequest): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        await apiUpdateInventoryItem(itemId, updates);
        await loadItems();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update item";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadItems]
  );

  const deleteItem = useCallback(
    async (itemId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        await apiDeleteInventoryItem(itemId);
        await loadItems();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete item";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadItems]
  );

  const recordTransaction = useCallback(
    async (data: Omit<CreateTransactionRequest, "school_id">): Promise<void> => {
      if (!schoolId) throw new Error("School ID required");

      try {
        setLoading(true);
        setError(null);
        await apiCreateTransaction({ ...data, school_id: schoolId });
        await Promise.all([loadItems(), loadTransactions()]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to record transaction";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [schoolId, loadItems, loadTransactions]
  );

  const deleteTransactionRecord = useCallback(
    async (transactionId: string): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        await apiDeleteTransaction(transactionId);
        await Promise.all([loadItems(), loadTransactions()]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete transaction";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [loadItems, loadTransactions]
  );

  useEffect(() => {
    if (schoolId) {
      loadItems();
      loadTransactions();
    }
  }, [schoolId, loadItems, loadTransactions]);

  return (
    <InventoryContext.Provider
      value={{
        items,
        lowStockItems,
        transactions,
        loading,
        error,
        loadItems,
        loadTransactions,
        createItem,
        updateItem,
        deleteItem,
        recordTransaction,
        deleteTransactionRecord,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error("useInventory must be used within InventoryProvider");
  }
  return context;
};
