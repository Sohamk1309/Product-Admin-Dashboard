"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../lib/axios";

export default function ProductDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const productId = params.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const createdProducts = JSON.parse(
          localStorage.getItem("createdProducts") || "[]"
        );

        const updatedProducts = JSON.parse(
          localStorage.getItem("updatedProducts") || "{}"
        );

        const deletedProductIds = JSON.parse(
          localStorage.getItem("deletedProductIds") || "[]"
        );

        const isDeleted = deletedProductIds.some(
          (id) => String(id) === String(productId)
        );

        if (isDeleted) {
          setProduct(null);
          setError("Product not found.");
          return;
        }

        const localCreatedProduct = createdProducts.find(
          (item) => String(item.id) === String(productId)
        );

        if (localCreatedProduct) {
          setProduct(localCreatedProduct);
          return;
        }

        const localUpdatedProduct =
          updatedProducts[productId];

        if (localUpdatedProduct) {
          setProduct(localUpdatedProduct);
          return;
        }

        const response = await api.get(
          `/products/${productId}`
        );

        if (!response.data) {
          setProduct(null);
          setError("Product not found.");
          return;
        }

        setProduct(response.data);
      } catch (requestError) {
        setProduct(null);
        setError("Product not found.");
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const goHome = () => {
    router.push("/products");
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-xl border bg-white px-8 py-6 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>

          <p className="text-sm font-medium text-gray-700">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6">
        <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-xl font-bold text-gray-900">
            Product Not Found
          </h1>

          <p className="mb-6 text-sm text-gray-500">
            The product you are looking for does not exist.
          </p>

          <button
            onClick={goHome}
            className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-medium text-white hover:bg-blue-600"
          >
            Home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={goHome}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Home
            </button>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Product Details
              </h1>

              <p className="text-sm text-gray-500">
                View product information
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 pt-6">
        <button
          onClick={goHome}
          className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          ← Back to Products
        </button>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-6 rounded-xl border bg-white p-6 shadow-sm lg:grid-cols-2">
          <div>
            <img
              src={
                product.thumbnail ||
                product.images?.[0] ||
                "https://dummyjson.com/image/600x400"
              }
              alt={product.title}
              className="h-96 w-full rounded-xl object-cover"
            />

            {product.images &&
              product.images.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {product.images
                    .slice(0, 4)
                    .map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        className="h-20 w-full rounded-lg border object-cover"
                      />
                    ))}
                </div>
              )}
          </div>

          <div>
            <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-sm capitalize text-blue-700">
              {product.category}
            </span>

            <h2 className="mt-4 text-3xl font-bold text-gray-900">
              {product.title}
            </h2>

            {product.brand && (
              <p className="mt-2 text-sm text-gray-500">
                Brand: {product.brand}
              </p>
            )}

            <div className="mt-4 flex items-center gap-2">
              <span className="text-lg">
                ⭐
              </span>

              <span className="font-semibold text-gray-900">
                {product.rating || "N/A"}
              </span>
            </div>

            <p className="mt-5 text-3xl font-bold text-gray-900">
              ${Number(product.price || 0).toFixed(2)}
            </p>

            {product.discountPercentage && (
              <p className="mt-1 text-sm text-green-600">
                {Number(
                  product.discountPercentage
                ).toFixed(1)}
                % discount
              </p>
            )}

            <div className="mt-5">
              <span
                className={`rounded-full px-3 py-1 text-sm ${
                  Number(product.stock) > 0
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {Number(product.stock) > 0
                  ? `${product.stock} items in stock`
                  : "Out of stock"}
              </span>
            </div>

            <div className="mt-6">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Description
              </h3>

              <p className="leading-7 text-gray-600">
                {product.description ||
                  "No description available."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-gray-900">
            Reviews
          </h2>

          {product.reviews &&
          product.reviews.length > 0 ? (
            <div className="space-y-4">
              {product.reviews.map(
                (review, index) => (
                  <div
                    key={index}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900">
                        {review.reviewerName}
                      </p>

                      <span className="text-sm">
                        ⭐ {review.rating}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      {review.comment}
                    </p>

                    {review.date && (
                      <p className="mt-2 text-xs text-gray-400">
                        {new Date(
                          review.date
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No reviews available.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}