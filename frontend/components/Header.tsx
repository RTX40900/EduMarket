import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const Header = () => {
  return (
    <header className="w-full fixed top-0 bg-white shadow-md z-50">
      <div className="container mx-auto flex justify-between items-center py-4">
        <Link href="/" className="text-xl font-semibold text-indigo-600">
          EduMarket
        </Link>
        <nav className="space-x-4">
          <Link href="/buy-courses">
            <Button variant="ghost" className="text-gray-600 hover:text-indigo-600">
              Buy Courses
            </Button>
          </Link>
          <Link href="/create-course">
            <Button variant="ghost" className="text-gray-600 hover:text-indigo-600">
              Create Course
            </Button>
          </Link>
          <Link href="/my-courses">
            <Button variant="ghost" className="text-gray-600 hover:text-indigo-600">
              My Courses
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;