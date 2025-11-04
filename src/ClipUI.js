import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./ClipUI.css";

export default function ClipUI() {
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null); // for modal
  const [displayImages, setDisplayImages] = useState([]);

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/images.json")
      .then((res) => res.json())
      .then((imageNames) => {
        const imagePaths = imageNames.map((name) => ({
          url: process.env.PUBLIC_URL + `/images/${name}`,
          thumbnailURL: process.env.PUBLIC_URL + `/thumbnails/${name}`,
        }));

        // Pick 32 random images once
        const shuffled = [...imagePaths].sort(() => 0.5 - Math.random());
        setDisplayImages(shuffled.slice(0, 32));
      });
  }, []);

  // 新增 Esc 鍵關閉 modal 的事件監聽
  useEffect(() => {
    if (!selectedImage) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [selectedImage]);

  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const currentIdx = displayImages.findIndex(
          (img) => img.url === selectedImage
        );
        if (currentIdx === -1) return;
        if (e.key === "ArrowLeft") {
          const prevIdx =
            (currentIdx - 1 + displayImages.length) % displayImages.length;
          setSelectedImage(displayImages[prevIdx].url);
        }
        if (e.key === "ArrowRight") {
          const nextIdx = (currentIdx + 1) % displayImages.length;
          setSelectedImage(displayImages[nextIdx].url);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, displayImages]);

  const handleSearch = () => {
    console.log("Searching text:", text);
    // Here you can filter or trigger a search on your images based on the text
  };

  return (
    <div className="clip-container">
      <h1
        className="clip-title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        CLIP Album Generation System
      </h1>

      <div className="clip-grid">
        {/* Text Search */}
        <div className="clip-card">
          <h2 className="clip-card-title">Search with Text</h2>
          <textarea
            placeholder="Enter text to search images..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="clip-textarea"
          />
          <button onClick={handleSearch} className="clip-btn clip-btn-blue">
            Search
          </button>
        </div>
      </div>

      {/* Display Images */}
      <div className="clip-img-section">
        <h2 className="clip-card-title">Random 32 Images from Folder</h2>
        <div className="clip-img-grid">
          {/* randomly select 32 images to display */}
          {displayImages.map((img, idx) => (
            <div
              key={idx}
              className="clip-img-wrapper"
              onClick={() => setSelectedImage(img.url)}
            >
              <img
                src={img.thumbnailURL}
                alt={`img-${idx}`}
                className="clip-img"
                style={{ cursor: "pointer" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Modal for full image */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="clip-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              className="clip-modal-close"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
            {/* 左箭頭 */}
            <button
              className="clip-modal-arrow clip-modal-arrow-left"
              onClick={() => {
                const currentIdx = displayImages.findIndex(
                  (img) => img.url === selectedImage
                );
                if (currentIdx === -1) return;
                const prevIdx =
                  (currentIdx - 1 + displayImages.length) %
                  displayImages.length;
                setSelectedImage(displayImages[prevIdx].url);
              }}
            >
              &#8592;
            </button>
            {/* 右箭頭 */}
            <button
              className="clip-modal-arrow clip-modal-arrow-right"
              onClick={() => {
                const currentIdx = displayImages.findIndex(
                  (img) => img.url === selectedImage
                );
                if (currentIdx === -1) return;
                const nextIdx = (currentIdx + 1) % displayImages.length;
                setSelectedImage(displayImages[nextIdx].url);
              }}
            >
              &#8594;
            </button>
            <AnimatePresence mode="wait">
              <motion.img
                key={selectedImage}
                src={selectedImage}
                alt="full-view"
                className="clip-modal-img"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
              />
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
