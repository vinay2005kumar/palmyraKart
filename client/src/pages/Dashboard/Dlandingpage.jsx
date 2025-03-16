import React, { useState } from "react";
import { Route, Routes } from "react-router-dom";
import Dhome from "./Dhome"; // Correct path (assuming Dhome is in the same folder)
import Dorders from "./Dorders"; // Correct path (assuming Dorders is in the same folder)
import Ddelivered from "./Ddelivered"; // Correct path (assuming Ddelivered is in the same folder)
import Expired from "./Expired"; // Correct path (assuming Expired is in the same folder)
import Dreviews from "./Dreviews"; // Correct path (assuming Dreviews is in the same folder)
import AuthPage from "../Customer/AuthForm"; // Correct path (assuming AuthForm is in the Customer folder)
const Dlandingpage = () => {
  const [dkart, setdkart] = useState();
  const [orderDetails, setOrderDetails] = useState(null);

  // Callback function to receive order details from Dorders
  const handleOrderDetails = (details) => {
    setOrderDetails(details);
    console.log("lading", details);
  };

  const handleiskartOpen = () => {
    setdkart((prev) => !prev);
    console.log("dlanding kart", dkart);
  };

  return (
    <div>
      <Routes>
        {/* Admin routes with /admin prefix */}
        <Route path="/dhome" element={<Dhome onKartOpen={handleiskartOpen} />} />
        <Route
          path="/dorders"
          element={<Dorders onOrderDetails={handleOrderDetails} />}
        />
        <Route path="/delivered" element={<Ddelivered />} />
        <Route path="/expired" element={<Expired />} />
        <Route path="/dreviews" element={<Dreviews />} />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>

      {/* {orderDetails && (
        <div>
          <h2>Order Details:</h2>
          <pre>{JSON.stringify(orderDetails, null, 2)}</pre>
        </div>
      )} */}
    </div>
  );
};

export default Dlandingpage;