import { createFlexCarousel } from "./flexcarousel.js";

// Put your photos into public/photos/ with these names (or change the list).
// A missing photo shows a numbered placeholder card instead.
const PHOTOS = [
  { src: "photos/gallery-01.jpg", title: "Summer at the sea", subtitle: "2024" },
  { src: "photos/gallery-02.jpg", title: "Grandma's birthday", subtitle: "2025" },
  { src: "photos/gallery-03.jpg", title: "New Year's Eve", subtitle: "2025" },
  { src: "photos/gallery-04.jpg", title: "Our cat Barsik", subtitle: "every day" },
  { src: "photos/gallery-05.jpg", title: "Trip to the village", subtitle: "2023" },
  { src: "photos/gallery-06.jpg", title: "First day of school", subtitle: "2019" },
  { src: "photos/gallery-07.jpg", title: "Family game night", subtitle: "Friday" },
  { src: "photos/gallery-08.jpg", title: "All of us together", subtitle: "2026" },
];

const slide = document.querySelector(".gallery-slide");
let started = false;

// Build the carousel the first time its slide is shown, so the intro plays in front of the audience
function maybeStart() {
  if (started || !slide.classList.contains("active")) return;
  started = true;
  createFlexCarousel(document.getElementById("gallery"), {
    items: PHOTOS.map((p) => ({ ...p, alt: p.title })),
    preset: "liquid",
    intro: "rise",
    cardHeight: 0.62,
    gap: 12,
    squeeze: 0.2,
    focusOnClick: true,
    captions: true,
  });
}

document.addEventListener("slidechange", maybeStart);
maybeStart();
