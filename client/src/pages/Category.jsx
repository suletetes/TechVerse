// src/pages/Category.jsx
import React, { useState, useMemo } from "react";
import ProductFilters from "../components/ProductFilters";
import ProductCard from "../components/ProductCard";
import ProductCardList from "../components/ProductCardList";
import Pagination from "../components/Pagination";
import ViewToggle from "../components/ViewToggle";

// Example product data - expanded for better demonstration
const phones = [
    {
        id: 1,
        name: "Phone Pro",
        price: "From £2000",
        numericPrice: 2000,
        brand: "TechBrand",
        category: "flagship",
        rating: 4.8,
        image: "../img/phone-product.jpg",
        webp: "../img/phone-product.webp",
        link: "/product/1",
    },
    {
        id: 2,
        name: "Phone Lite",
        price: "From £1500",
        numericPrice: 1500,
        brand: "TechBrand",
        category: "mid-range",
        rating: 4.5,
        image: "../img/phone-product.jpg",
        webp: "../img/phone-product.webp",
        link: "/product/2",
    },
    {
        id: 3,
        name: "Phone Ultra",
        price: "From £2500",
        numericPrice: 2500,
        brand: "TechBrand",
        category: "flagship",
        rating: 4.9,
        image: "../img/phone-product.jpg",
        webp: "../img/phone-product.webp",
        link: "/product/3",
    },
    {
        id: 4,
        name: "Phone Basic",
        price: "From £800",
        numericPrice: 800,
        brand: "ValueBrand",
        category: "budget",
        rating: 4.2,
        image: "../img/phone-product.jpg",
        webp: "../img/phone-product.webp",
        link: "/product/4",
    },
    {
        id: 5,
        name: "Phone Max",
        price: "From £3000",
        numericPrice: 3000,
        brand: "PremiumBrand",
        category: "flagship",
        rating: 4.7,
        image: "../img/phone-product.jpg",
        webp: "../img/phone-product.webp",
        link: "/product/5",
    },
    {
        id: 6,
        name: "Phone Mini",
        price: "From £1200",
        numericPrice: 1200,
        brand: "CompactBrand",
        category: "mid-range",
        rating: 4.4,
        image: "../img/phone-product.jpg",
        webp: "../img/phone-product.webp",
        link: "/product/6",
    },
    {
        id: 7,
        name: "Phone Edge",
        price: "From £1800",
        numericPrice: 1800,
        brand: "TechBrand",
        category: "mid-range",
        rating: 4.6,
        image: "../img/phone-product.jpg",
        webp: "../img/phone-product.webp",
        link: "/product/7",
    },
    {
        id: 8,
        name: "Phone Fold",
        price: "From £3500",
        numericPrice: 3500,
        brand: "InnovaBrand",
        category: "flagship",
        rating: 4.3,
        image: "../img/phone-product.jpg",
        webp: "../img/phone-product.webp",
        link: "/product/8",
    },
];

const Category = () => {
    // State management
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [filterBrand, setFilterBrand] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [priceRange, setPriceRange] = useState([0, 4000]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6);
    const [viewMode, setViewMode] = useState("grid");

    // Get unique brands and categories for filters
    const brands = [...new Set(phones.map(phone => phone.brand))];
    const categories = [...new Set(phones.map(phone => phone.category))];

    // Filter and sort logic
    const filteredAndSortedPhones = useMemo(() => {
        let filtered = phones.filter(phone => {
            const matchesSearch = phone.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesBrand = !filterBrand || phone.brand === filterBrand;
            const matchesCategory = !filterCategory || phone.category === filterCategory;
            const matchesPrice = phone.numericPrice >= priceRange[0] && phone.numericPrice <= priceRange[1];
            
            return matchesSearch && matchesBrand && matchesCategory && matchesPrice;
        });

        // Sort logic
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "price-low":
                    return a.numericPrice - b.numericPrice;
                case "price-high":
                    return b.numericPrice - a.numericPrice;
                case "rating":
                    return b.rating - a.rating;
                case "name":
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return filtered;
    }, [searchTerm, sortBy, filterBrand, filterCategory, priceRange]);

    // Pagination logic
    const totalPages = Math.ceil(filteredAndSortedPhones.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentPhones = filteredAndSortedPhones.slice(startIndex, startIndex + itemsPerPage);

    // Reset to first page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy, filterBrand, filterCategory, priceRange]);

    const clearFilters = () => {
        setSearchTerm("");
        setFilterBrand("");
        setFilterCategory("");
        setPriceRange([0, 4000]);
        setSortBy("name");
        setCurrentPage(1);
    };

    return (
        <div className="bloc bgc-5700 none full-width-bloc l-bloc" id="bloc-8">
            <div className="container bloc-md-sm bloc-md bloc-lg-md">
                <div className="row row-offset">
                    {/* Header */}
                    <div className="col-lg-12 ps-0 pe-0 mb-4">
                        <div className="d-flex justify-content-between align-items-center">
                            <h1 className="tc-6533 mb-0">Phones</h1>
                            <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <ProductFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        filterBrand={filterBrand}
                        setFilterBrand={setFilterBrand}
                        filterCategory={filterCategory}
                        setFilterCategory={setFilterCategory}
                        priceRange={priceRange}
                        setPriceRange={setPriceRange}
                        brands={brands}
                        categories={categories}
                        onClearFilters={clearFilters}
                        resultsCount={filteredAndSortedPhones.length}
                    />

                    {/* Products Grid/List */}
                    {currentPhones.length === 0 ? (
                        <div className="col-12 text-center py-5">
                            <div className="tc-6533">
                                <i className="fa fa-search fa-3x mb-3 opacity-50"></i>
                                <h4>No products found</h4>
                                <p>Try adjusting your search or filter criteria</p>
                                <button className="btn btn-c-2101 btn-rd" onClick={clearFilters}>
                                    Clear All Filters
                                </button>
                            </div>
                        </div>
                    ) : viewMode === 'grid' ? (
                        currentPhones.map((phone) => (
                            <ProductCard key={phone.id} product={phone} />
                        ))
                    ) : (
                        currentPhones.map((phone) => (
                            <ProductCardList key={phone.id} product={phone} />
                        ))
                    )}

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        startIndex={startIndex}
                        itemsPerPage={itemsPerPage}
                        totalItems={filteredAndSortedPhones.length}
                    />
                </div>
            </div>
        </div>
    );
};

export default Category;