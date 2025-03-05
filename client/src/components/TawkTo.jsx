import React, { useEffect } from "react";

const TawkTo = () => {
    useEffect(() => {
        var Tawk_API = Tawk_API || {};
        var Tawk_LoadStart = new Date();
        const script = document.createElement("script");
        script.async = true;
        script.src = "https://embed.tawk.to/6776c14149e2fd8dfe01bb75/1igju5qq8";
        script.charset = "UTF-8";
        script.setAttribute("crossorigin", "*");
        document.body.appendChild(script);

        // Cleanup to remove the script when the component unmounts
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return null; // This component doesn't render anything visually
};

export default TawkTo;
