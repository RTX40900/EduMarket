import React, { useState, useEffect } from "react";
import { useWallet } from "./WalletContext";
import contractJson from "@/contracts/CourseStorage.sol/CourseStorage.json";
import { Contracts } from "@/types";
import { Button } from "@/components/ui/button";
import { CourseStorageContractAddress } from "@/app/constants";

interface Course {
  id: number;
  title: string;
  description: string;
  price: string;
}

const BuyCourses: React.FC = () => {
  const { web3, accountAddress, isConnected } = useWallet();
  const [courses, setCourses] = useState<Course[]>([]);
  const [contracts, setContracts] = useState<Contracts | undefined>(undefined);

  useEffect(() => {
    if (web3 && isConnected) {
      const CourseStorage = new web3.eth.Contract(
        contractJson.abi,
        CourseStorageContractAddress
      ) as Contracts;
      setContracts(CourseStorage);
    }
  }, [web3, isConnected]);

  const fetchCourses = async () => {
    if (contracts) {
      try {
        const courseCount = await contracts.methods.getCourseCount().call();
        const fetchedCourses: Course[] = [];
        for (let i = 0; i < courseCount; i++) {
          const course = await contracts.methods.getCourse(i).call();
          fetchedCourses.push({
            id: i,
            title: course.title,
            description: course.description,
            price: web3!.utils.fromWei(course.price, "ether"),
          });
        }
        setCourses(fetchedCourses);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      }
    }
  };

  const purchaseCourse = async (courseId: number, price: string) => {
    if (contracts && web3) {
      try {
        const priceWei = web3.utils.toWei(price, "ether");
        await contracts.methods.purchaseCourse(courseId).send({
          from: accountAddress,
          value: priceWei,
        });
        alert("Course purchased successfully!");
      } catch (error) {
        console.error("Failed to purchase course:", error);
      }
    }
  };

  const giftCourse = async (courseId: number, price: string, recipient: string) => {
    if (contracts && web3) {
      try {
        const priceWei = web3.utils.toWei(price, "ether");
        await contracts.methods.giftCourse(courseId, recipient).send({
          from: accountAddress,
          value: priceWei,
        });
        alert("Course gifted successfully!");
      } catch (error) {
        console.error("Failed to gift course:", error);
      }
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchCourses();
    }
  }, [isConnected]);

  return (
    <div>
      <h2>Available Courses</h2>
      {courses.map((course) => (
        <div key={course.id}>
          <h3>{course.title}</h3>
          <p>{course.description}</p>
          <p>Price: {course.price} ETH</p>
          <Button onClick={() => purchaseCourse(course.id, course.price)}>Purchase</Button>
          <Button onClick={() => giftCourse(course.id, course.price, "recipient_address")}>
            Gift
          </Button>
        </div>
      ))}
    </div>
  );
};

export default BuyCourses;