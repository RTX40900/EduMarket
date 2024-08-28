"use client";

const CoursePage = ({params}) => {
  const { id } = params;

  return (
    <div>
      <h1>Course ID: {id}</h1>
      {/* Render course details here */}
    </div>
  );
};

export default CoursePage;
