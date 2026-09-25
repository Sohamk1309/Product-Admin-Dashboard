"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "../../lib/axios";

const emptyProduct = {
  title: "",
  price: "",
  category: "",
  description: "",
  stock: "",
  rating: "",
  thumbnail: "",
};

function ProductsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestIdRef = useRef(0);

  const initialPage = Number(searchParams.get("page")) || 1;
  const initialPageSize = Number(searchParams.get("pageSize")) || 10;
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialSortBy = searchParams.get("sortBy") || "";
  const initialOrder = searchParams.get("order") || "asc";

  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dataReady, setDataReady] = useState(false);

  const [categories, setCategories] = useState([]);

  const [createdProducts, setCreatedProducts] = useState([]);
  const [updatedProducts, setUpdatedProducts] = useState({});
  const [deletedProductIds, setDeletedProductIds] = useState([]);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [productError, setProductError] = useState("");
  const [savingProduct, setSavingProduct] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);

  const [category, setCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [order, setOrder] = useState(initialOrder);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.push("/login");
      return;
    }

    const savedCreatedProducts = localStorage.getItem("createdProducts");
    const savedUpdatedProducts = localStorage.getItem("updatedProducts");
    const savedDeletedProductIds = localStorage.getItem("deletedProductIds");

    if (savedCreatedProducts) {
      try {
        setCreatedProducts(JSON.parse(savedCreatedProducts));
      } catch {
        setCreatedProducts([]);
      }
    }

    if (savedUpdatedProducts) {
      try {
        setUpdatedProducts(JSON.parse(savedUpdatedProducts));
      } catch {
        setUpdatedProducts({});
      }
    }

    if (savedDeletedProductIds) {
      try {
        setDeletedProductIds(JSON.parse(savedDeletedProductIds));
      } catch {
        setDeletedProductIds([]);
      }
    }

    setDataReady(true);
  }, [router]);

  useEffect(() => {
    if (!dataReady) return;

    const fetchCategories = async () => {
      try {
        const response = await api.get("/products/categories");

        const categoryData = Array.isArray(response.data)
          ? response.data
          : [];

        const categoryNames = categoryData
          .map((item) => {
            if (typeof item === "string") {
              return item;
            }

            return item.slug || item.name || "";
          })
          .filter(Boolean);

        setCategories(categoryNames);
      } catch {
        setCategories([]);
      }
    };

    fetchCategories();
  }, [dataReady]);

  const saveCreatedProducts = (productsData) => {
    localStorage.setItem(
      "createdProducts",
      JSON.stringify(productsData)
    );
  };

  const saveUpdatedProducts = (productsData) => {
    localStorage.setItem(
      "updatedProducts",
      JSON.stringify(productsData)
    );
  };

  const saveDeletedProductIds = (ids) => {
    localStorage.setItem(
      "deletedProductIds",
      JSON.stringify(ids)
    );
  };

  const fetchProducts = async (signal, searchValue = search) => {
    const currentRequestId = ++requestIdRef.current;

    setLoading(true);
    setError("");

    try {
      const trimmedSearch = searchValue.trim();

      let response;

      if (trimmedSearch !== "") {
        response = await api.get(
          `/products/search?q=${encodeURIComponent(
            trimmedSearch
          )}&limit=0`,
          {
            signal,
          }
        );
      } else {
        response = await api.get("/products?limit=0", {
          signal,
        });
      }

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      let remoteProducts = Array.isArray(response.data.products)
        ? response.data.products
        : [];

      let localCreatedProducts = [...createdProducts];

      if (trimmedSearch !== "") {
        const searchLower = trimmedSearch.toLowerCase();

        localCreatedProducts = localCreatedProducts.filter(
          (product) => {
            return (
              String(product.title || "")
                .toLowerCase()
                .includes(searchLower) ||
              String(product.description || "")
                .toLowerCase()
                .includes(searchLower) ||
              String(product.category || "")
                .toLowerCase()
                .includes(searchLower) ||
              String(product.brand || "")
                .toLowerCase()
                .includes(searchLower)
            );
          }
        );
      }

      remoteProducts = remoteProducts.filter(
        (product) =>
          !deletedProductIds.includes(product.id)
      );

      localCreatedProducts = localCreatedProducts.filter(
        (product) =>
          !deletedProductIds.includes(product.id)
      );

      remoteProducts = remoteProducts.map((product) => {
        if (updatedProducts[product.id]) {
          return {
            ...product,
            ...updatedProducts[product.id],
          };
        }

        return product;
      });

      const combinedProducts = [
        ...localCreatedProducts,
        ...remoteProducts,
      ];

      setAllProducts(combinedProducts);
      setLoading(false);
    } catch (requestError) {
      if (requestError.name === "CanceledError") {
        return;
      }

      if (requestError.name === "AbortError") {
        return;
      }

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      setError(
        requestError?.response?.data?.message ||
          "Failed to load products. Please try again."
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dataReady) return;

    const controller = new AbortController();

    fetchProducts(controller.signal, search);

    return () => {
      controller.abort();
    };
  }, [
    dataReady,
    search,
    createdProducts,
    updatedProducts,
    deletedProductIds,
  ]);

  useEffect(() => {
    if (!dataReady) return;

    const timer = setTimeout(() => {
      const trimmedSearch = searchInput.trim();

      setSearch(trimmedSearch);
      setPage(1);

      updateUrl({
        search: trimmedSearch,
        page: 1,
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, dataReady]);

  useEffect(() => {
    if (!dataReady) return;

    let filteredProducts = [...allProducts];

    if (category) {
      filteredProducts = filteredProducts.filter(
        (product) =>
          String(product.category || "").toLowerCase() ===
          category.toLowerCase()
      );
    }

    if (sortBy) {
      filteredProducts.sort((a, b) => {
        let valueA;
        let valueB;

        if (sortBy === "title") {
          valueA = String(a.title || "").toLowerCase();
          valueB = String(b.title || "").toLowerCase();
        } else {
          valueA = Number(a[sortBy]) || 0;
          valueB = Number(b[sortBy]) || 0;
        }

        if (valueA < valueB) {
          return order === "asc" ? -1 : 1;
        }

        if (valueA > valueB) {
          return order === "asc" ? 1 : -1;
        }

        return 0;
      });
    }

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    setProducts(
      filteredProducts.slice(startIndex, endIndex)
    );
  }, [
    allProducts,
    category,
    sortBy,
    order,
    page,
    pageSize,
    dataReady,
  ]);

  const updateUrl = (updates) => {
    const params = new URLSearchParams(
      searchParams.toString()
    );

    Object.entries(updates).forEach(([key, value]) => {
      if (
        value === "" ||
        value === null ||
        value === undefined
      ) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    router.push(`/products?${params.toString()}`);
  };

  const filteredTotal = (() => {
    let filteredProducts = [...allProducts];

    if (category) {
      filteredProducts = filteredProducts.filter(
        (product) =>
          String(product.category || "").toLowerCase() ===
          category.toLowerCase()
      );
    }

    return filteredProducts.length;
  })();

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTotal / pageSize)
  );

  const startItem =
    filteredTotal === 0
      ? 0
      : (page - 1) * pageSize + 1;

  const endItem = Math.min(
    page * pageSize,
    filteredTotal
  );

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) {
      return;
    }

    setPage(newPage);

    updateUrl({
      page: newPage,
    });
  };

  const handlePageSizeChange = (event) => {
    const newPageSize = Number(event.target.value);

    setPageSize(newPageSize);
    setPage(1);

    updateUrl({
      pageSize: newPageSize,
      page: 1,
    });
  };

  const handleCategoryChange = (event) => {
    const newCategory = event.target.value;

    setCategory(newCategory);
    setPage(1);

    updateUrl({
      category: newCategory,
      page: 1,
    });
  };

  const handleSortChange = (event) => {
    const newSortBy = event.target.value;

    setSortBy(newSortBy);
    setPage(1);

    updateUrl({
      sortBy: newSortBy,
      page: 1,
    });
  };

  const handleOrderChange = (event) => {
    const newOrder = event.target.value;

    setOrder(newOrder);
    setPage(1);

    updateUrl({
      order: newOrder,
      page: 1,
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm(emptyProduct);
    setProductError("");
    setShowProductModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);

    setProductForm({
      title: product.title || "",
      price: product.price ?? "",
      category: product.category || "",
      description: product.description || "",
      stock: product.stock ?? "",
      rating: product.rating ?? "",
      thumbnail: product.thumbnail || "",
    });

    setProductError("");
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    if (savingProduct) {
      return;
    }

    setShowProductModal(false);
    setEditingProduct(null);
    setProductForm(emptyProduct);
    setProductError("");
  };

  const handleProductFormChange = (event) => {
    const { name, value } = event.target;

    setProductForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const validateProductForm = () => {
    if (!productForm.title.trim()) {
      return "Product title is required.";
    }

    if (!productForm.category.trim()) {
      return "Category is required.";
    }

    if (!productForm.description.trim()) {
      return "Description is required.";
    }

    if (
      productForm.price === "" ||
      Number(productForm.price) < 0
    ) {
      return "Please enter a valid price.";
    }

    if (
      productForm.stock === "" ||
      Number(productForm.stock) < 0
    ) {
      return "Please enter a valid stock value.";
    }

    if (
      productForm.rating !== "" &&
      (Number(productForm.rating) < 0 ||
        Number(productForm.rating) > 5)
    ) {
      return "Rating must be between 0 and 5.";
    }

    return "";
  };

  const handleSaveProduct = async (event) => {
    event.preventDefault();

    if (savingProduct) {
      return;
    }

    const validationError = validateProductForm();

    if (validationError) {
      setProductError(validationError);
      return;
    }

    setSavingProduct(true);
    setProductError("");

    try {
      const payload = {
        title: productForm.title.trim(),
        price: Number(productForm.price),
        category: productForm.category.trim(),
        description: productForm.description.trim(),
        stock: Number(productForm.stock),
        rating:
          productForm.rating === ""
            ? 0
            : Number(productForm.rating),
        thumbnail: productForm.thumbnail.trim(),
      };

      if (editingProduct) {
        const isLocalProduct = createdProducts.some(
          (product) =>
            product.id === editingProduct.id
        );

        if (isLocalProduct) {
          const updatedLocalProduct = {
            ...editingProduct,
            ...payload,
          };

          const newCreatedProducts =
            createdProducts.map((product) =>
              product.id === editingProduct.id
                ? updatedLocalProduct
                : product
            );

          setCreatedProducts(newCreatedProducts);
          saveCreatedProducts(newCreatedProducts);

          setAllProducts((previous) =>
            previous.map((product) =>
              product.id === editingProduct.id
                ? updatedLocalProduct
                : product
            )
          );
        } else {
          const response = await api.put(
            `/products/${editingProduct.id}`,
            payload
          );

          const updatedProduct = {
            ...editingProduct,
            ...payload,
            ...(response.data || {}),
          };

          const newUpdatedProducts = {
            ...updatedProducts,
            [editingProduct.id]: updatedProduct,
          };

          setUpdatedProducts(newUpdatedProducts);
          saveUpdatedProducts(newUpdatedProducts);

          setAllProducts((previous) =>
            previous.map((product) =>
              product.id === editingProduct.id
                ? updatedProduct
                : product
            )
          );
        }
      } else {
        const response = await api.post(
          "/products/add",
          payload
        );

        const newProduct = {
          ...payload,
          ...(response.data || {}),
          id:
            response.data?.id &&
            !createdProducts.some(
              (product) =>
                product.id === response.data.id
            )
              ? response.data.id
              : -Date.now(),
        };

        const newCreatedProducts = [
          newProduct,
          ...createdProducts,
        ];

        setCreatedProducts(newCreatedProducts);
        saveCreatedProducts(newCreatedProducts);

        setAllProducts((previous) => [
          newProduct,
          ...previous,
        ]);
      }

      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm(emptyProduct);
      setProductError("");
    } catch (requestError) {
      setProductError(
        requestError?.response?.data?.message ||
          "Unable to save product. Please try again."
      );
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (deletingProductId !== null) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.title}"?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingProductId(product.id);
    setError("");

    try {
      const isLocalProduct = createdProducts.some(
        (item) => item.id === product.id
      );

      if (isLocalProduct) {
        const newCreatedProducts =
          createdProducts.filter(
            (item) => item.id !== product.id
          );

        setCreatedProducts(newCreatedProducts);
        saveCreatedProducts(newCreatedProducts);

        const newUpdatedProducts = {
          ...updatedProducts,
        };

        delete newUpdatedProducts[product.id];

        setUpdatedProducts(newUpdatedProducts);
        saveUpdatedProducts(newUpdatedProducts);

        setAllProducts((previous) =>
          previous.filter(
            (item) => item.id !== product.id
          )
        );

        return;
      }

      await api.delete(`/products/${product.id}`);

      const newDeletedIds = [
        ...deletedProductIds,
        product.id,
      ];

      setDeletedProductIds(newDeletedIds);
      saveDeletedProductIds(newDeletedIds);

      const newUpdatedProducts = {
        ...updatedProducts,
      };

      delete newUpdatedProducts[product.id];

      setUpdatedProducts(newUpdatedProducts);
      saveUpdatedProducts(newUpdatedProducts);

      setAllProducts((previous) =>
        previous.filter(
          (item) => item.id !== product.id
        )
      );
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to delete product. Please try again."
      );
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleProductClick = (product) => {
    router.push(`/products/${product.id}`);
  };

  if (!dataReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-600">
          Checking authentication...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Product Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage your products
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={category}
              onChange={handleCategoryChange}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={handleSortChange}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Sort By</option>
              <option value="title">Title</option>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
            </select>

            <select
              value={order}
              onChange={handleOrderChange}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>

            <button
              onClick={openAddModal}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Add Product
            </button>
          </div>
        </div>

        {loading && (
          <div className="rounded-lg border bg-white p-8 text-center">
            <p className="text-sm text-gray-600">
              Loading products...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="mb-4 text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={() => {
                const controller = new AbortController();
                fetchProducts(
                  controller.signal,
                  search
                );
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="rounded-lg border bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No products found
            </h2>

            <p className="mt-2 text-sm text-gray-900">
              Try changing your search or filters.
            </p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <div className="hidden overflow-hidden rounded-lg border bg-white md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-900px">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                        Product
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                        Category
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                        Price
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                        Rating
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-700">
                        Stock
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-4 py-4">
                          <button
                            onClick={() =>
                              handleProductClick(product)
                            }
                            className="flex items-center gap-3 text-left"
                          >
                            <img
                              src={
                                product.thumbnail ||
                                product.images?.[0]
                              }
                              alt={product.title}
                              className="h-12 w-12 rounded-lg object-cover"
                            />

                            <div>
                              <p className="font-medium text-gray-900 hover:text-blue-600">
                                {product.title}
                              </p>

                              <p className="mt-1 text-xs text-gray-700">
                                ID: {product.id}
                              </p>
                            </div>
                          </button>
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {product.category}
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          ${Number(product.price || 0).toFixed(2)}
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {product.rating ?? "N/A"}
                        </td>

                        <td className="px-4 py-4 text-sm font-medium text-gray-900">
                          {product.stock ?? 0}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                openEditModal(product)
                              }
                              className="rounded-lg border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50"
                            >
                              Edit
                            </button>

                            <button
                              onClick={() =>
                                handleDeleteProduct(product)
                              }
                              disabled={
                                deletingProductId ===
                                product.id
                              }
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingProductId ===
                              product.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4 md:hidden">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="rounded-lg border bg-white p-4"
                >
                  <button
                    onClick={() =>
                      handleProductClick(product)
                    }
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <img
                      src={
                        product.thumbnail ||
                        product.images?.[0]
                      }
                      alt={product.title}
                      className="h-16 w-16 rounded-lg object-cover"
                    />

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-semibold text-gray-900">
                        {product.title}
                      </h2>

                      <p className="mt-1 text-sm font-medium text-gray-900">
                        {product.category}
                      </p>
                    </div>
                  </button>

                  <div className="mt-4 grid grid-cols-3 gap-3 border-t pt-4">
                    <div>
                      <p className="text-xs text-gray-700">
                        Price
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        ${Number(product.price || 0).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-700">
                        Rating
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {product.rating ?? "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-700">
                        Stock
                      </p>

                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {product.stock ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() =>
                        openEditModal(product)
                      }
                      className="flex-1 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDeleteProduct(product)
                      }
                      disabled={
                        deletingProductId === product.id
                      }
                      className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingProductId === product.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-lg border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-medium text-gray-900">
                Showing {startItem}–{endItem} of{" "}
                {filteredTotal}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="pageSize"
                    className="text-sm font-medium text-gray-900"
                  >
                    Page size
                  </label>

                  <select
                    id="pageSize"
                    value={pageSize}
                    onChange={handlePageSizeChange}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      handlePageChange(page - 1)
                    }
                    disabled={page === 1}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1
                  )
                    .filter((pageNumber) => {
                      if (totalPages <= 5) {
                        return true;
                      }

                      if (pageNumber === 1) {
                        return true;
                      }

                      if (pageNumber === totalPages) {
                        return true;
                      }

                      return (
                        pageNumber >= page - 1 &&
                        pageNumber <= page + 1
                      );
                    })
                    .map(
                      (
                        pageNumber,
                        index,
                        visiblePages
                      ) => {
                        const previousPageNumber =
                          visiblePages[index - 1];

                        const showEllipsis =
                          index > 0 &&
                          pageNumber -
                            previousPageNumber >
                            1;

                        return (
                          <div
                            key={pageNumber}
                            className="flex items-center gap-1"
                          >
                            {showEllipsis && (
                              <span className="px-1 text-gray-500">
                                ...
                              </span>
                            )}

                            <button
                              onClick={() =>
                                handlePageChange(
                                  pageNumber
                                )
                              }
                              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                                page === pageNumber
                                  ? "bg-blue-600 text-white"
                                  : "border border-gray-300 text-gray-900 hover:bg-gray-50"
                              }`}
                            >
                              {pageNumber}
                            </button>
                          </div>
                        );
                      }
                    )}

                  <button
                    onClick={() =>
                      handlePageChange(page + 1)
                    }
                    disabled={page === totalPages}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct
                    ? "Edit Product"
                    : "Add Product"}
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  {editingProduct
                    ? "Update product information."
                    : "Create a new product."}
                </p>
              </div>

              <button
                onClick={closeProductModal}
                disabled={savingProduct}
                className="text-2xl text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {productError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {productError}
              </div>
            )}

            <form
              onSubmit={handleSaveProduct}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">
                  Title
                </label>

                <input
                  type="text"
                  name="title"
                  value={productForm.title}
                  onChange={handleProductFormChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">
                    Price
                  </label>

                  <input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={productForm.price}
                    onChange={handleProductFormChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">
                    Stock
                  </label>

                  <input
                    type="number"
                    name="stock"
                    min="0"
                    value={productForm.stock}
                    onChange={handleProductFormChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Category
                  </label>

                  <select
                    name="category"
                    value={productForm.category}
                    onChange={handleProductFormChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">
                      Select Category
                    </option>

                    {categories.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-900">
                    Rating
                  </label>

                  <input
                    type="number"
                    name="rating"
                    min="0"
                    max="5"
                    step="0.1"
                    value={productForm.rating}
                    onChange={handleProductFormChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">
                  Thumbnail URL
                </label>

                <input
                  type="text"
                  name="thumbnail"
                  value={productForm.thumbnail}
                  onChange={handleProductFormChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">
                  Description
                </label>

                <textarea
                  name="description"
                  rows={4}
                  value={productForm.description}
                  onChange={handleProductFormChange}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-5">
                <button
                  type="button"
                  onClick={closeProductModal}
                  disabled={savingProduct}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingProduct}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingProduct
                    ? "Saving..."
                    : editingProduct
                    ? "Update Product"
                    : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-sm text-gray-600">
            Loading dashboard...
          </div>
        </div>
      }
    >
      <ProductsDashboard />
    </Suspense>
  );
}