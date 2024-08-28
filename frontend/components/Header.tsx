import React from "react";
import { Button } from "@/components/ui/button";

import Link from "next/link";


const Header = () => {
  return (
    <div className="w-full fixed top-0 bg-gradient-to-r from-blue-400 to-blue-500 shadow-md z-50">
      <div className="container mx-auto flex justify-between items-center py-4">
        <div className="text-white text-2xl font-bold">
          <Link href="/">
            EduMarket
          </Link>
        </div>
        <div className="flex space-x-4">
          {/* <Button variant="outline" className="text-teal border-lead hover:bg-teal hover:text-teal-500">

          </Button> */}
          <Link href="/buy-courses">
            <Button variant="outline" className="text-teal border-lead hover:bg-teal hover:text-teal-500">
              Buy Courses
            </Button>
          </Link>
          <Link href="/create-course">
            <Button variant="outline" className="text-teal border-lead hover:bg-teal hover:text-teal-500">
              Create Course
            </Button>
          </Link>
          <Link href="/my-courses">
            <Button variant="outline" className="text-teal border-lead hover:bg-teal hover:text-teal-500">
              My Courses
            </Button>
          </Link>
        </div>
      </div>
    </div>

  );
};

export default Header;