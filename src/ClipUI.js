import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./ClipUI.css";

export default function ClipUI() {
  const [text, setText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null); // for modal
  const [displayImages, setDisplayImages] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchImage, setIsSearchImage] = useState(false); // track if selected image is from search results

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/images.json")
      .then((res) => res.json())
      .then((imageNames) => {
        const imagePaths = imageNames.map((name) => ({
          url: process.env.PUBLIC_URL + `/images/${name}`,
          thumbnailURL: process.env.PUBLIC_URL + `/thumbnails/${name}`,
        }));

        const startIndex = Math.floor(
          Math.random() * Math.max(0, imagePaths.length - 32)
        );
        setDisplayImages(imagePaths.slice(startIndex, startIndex + 32));
      });
  }, []);

  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedImage(null);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const images = isSearchImage ? searchResults : displayImages;
        const currentIdx = images.findIndex((img) => img.url === selectedImage);
        if (currentIdx === -1) return;

        if (e.key === "ArrowLeft") {
          const prevIdx = (currentIdx - 1 + images.length) % images.length;
          setSelectedImage(images[prevIdx].url);
        }
        if (e.key === "ArrowRight") {
          const nextIdx = (currentIdx + 1) % images.length;
          setSelectedImage(images[nextIdx].url);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedImage, isSearchImage, searchResults, displayImages]);

  const handleSearch = () => {
    console.log("Searching text:", text);
    fetch("http://localhost:5001/embed-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Search results:", data);
        const searchImagePaths = data.filenames.map((name) => ({
          url: process.env.PUBLIC_URL + `/images/${name}`,
          thumbnailURL: process.env.PUBLIC_URL + `/thumbnails/${name}`,
        }));
        setSearchResults(searchImagePaths);
      })
      .catch((err) => {
        console.error("Error during search:", err);
      });
  };

  return (
    <div className="clip-container">
      <h1 className="clip-title">CLIP Album Generation System</h1>

      <div className="clip-grid">
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

      {searchResults.length > 0 && (
        <div className="clip-img-section">
          <h2 className="clip-card-title">Search Results</h2>
          <div className="clip-img-grid">
            {searchResults.map((img, idx) => (
              <div
                key={idx}
                className="clip-img-wrapper"
                onClick={() => {
                  setSelectedImage(img.url);
                  setIsSearchImage(true); // mark as search image
                }}
              >
                <img
                  src={img.thumbnailURL}
                  alt={`search-img-${idx}`}
                  className="clip-img"
                  style={{ cursor: "pointer" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="clip-img-section">
        <h2 className="clip-card-title">Random 32 Images from Folder</h2>
        <div className="clip-img-grid">
          {displayImages.map((img, idx) => (
            <div
              key={idx}
              className="clip-img-wrapper"
              onClick={() => {
                setSelectedImage(img.url);
                setIsSearchImage(false); // mark as random image
              }}
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
            <button
              className="clip-modal-arrow clip-modal-arrow-left"
              onClick={() => {
                const images = isSearchImage ? searchResults : displayImages;
                const currentIdx = images.findIndex(
                  (img) => img.url === selectedImage
                );
                if (currentIdx === -1) return;
                const prevIdx =
                  (currentIdx - 1 + images.length) % images.length;
                setSelectedImage(images[prevIdx].url);
              }}
            >
              &#8592;
            </button>
            <button
              className="clip-modal-arrow clip-modal-arrow-right"
              onClick={() => {
                const images = isSearchImage ? searchResults : displayImages;
                const currentIdx = images.findIndex(
                  (img) => img.url === selectedImage
                );
                if (currentIdx === -1) return;
                const nextIdx = (currentIdx + 1) % images.length;
                setSelectedImage(images[nextIdx].url);
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
