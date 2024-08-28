import React, { useState } from "react";
import { useWallet } from "./WalletContext";
import contractJson from "@/contracts/CourseStorage.sol/CourseStorage.json";
import { Contracts } from "@/types";
import { Button } from "@/components/ui/button";
import { CourseStorageContractAddress } from "@/app/constants";

const ListCourse: React.FC = () => {
  const { web3, accountAddress, isConnected } = useWallet();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const createCourse = async () => {
    if (web3 && isConnected) {
      try {
        const CourseStorage = new web3.eth.Contract(
          contractJson.abi,
          CourseStorageContractAddress
        ) as Contracts;
        const priceWei = web3.utils.toWei(price, "ether");
        await CourseStorage.methods.addCourse(title, description, priceWei).send({
          from: accountAddress,
        });
        alert("Course created successfully!");
        setTitle("");
        setDescription("");
        setPrice("");
      } catch (error) {
        console.error("Failed to create course:", error);
      }
    }
  };

  return (
    <div>
      <h2>List a New Course</h2>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <input
        type="text"
        placeholder="Price (ETH)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <Button onClick={createCourse}>Create Course</Button>
    </div>
  );
};

export default ListCourse;