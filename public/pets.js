import { createCircularCarousel } from "./circularcarousel.js";

// Photos live in public/photos/pets/. Titles and subtitles show under the ring.
const PETS = {
  potap: [
    { src: "photos/pets/potap-1.jpg", title: "Nap time", subtitle: "his favourite chair" },
    { src: "photos/pets/potap-2.jpg", title: "Garden ninja", subtitle: "nobody can see me" },
    { src: "photos/pets/potap-3.jpg", title: "Bathroom inspector", subtitle: "checking the sinks" },
    { src: "photos/pets/potap-4.jpg", title: "Sleepy face", subtitle: "do not disturb" },
  ],
  shanti: [
    { src: "photos/pets/shanti-1.jpg", title: "Total relax", subtitle: "belly up" },
    { src: "photos/pets/shanti-2.jpg", title: "Winter sunset", subtitle: "a walk in the fields" },
    { src: "photos/pets/shanti-3.jpg", title: "Snow day", subtitle: "her favourite weather" },
    { src: "photos/pets/shanti-4.jpg", title: "Say cheese!", subtitle: "a very good smile" },
    { src: "photos/pets/shanti-5.jpg", title: "Good girl", subtitle: "waiting for a treat" },
  ],
};

const started = new Set();

// Each ring is built the first time its slide is shown, so the intro plays in front of the audience
function maybeStart() {
  document.querySelectorAll(".slide.active .pet-carousel").forEach((root) => {
    const pet = root.dataset.pet;
    if (started.has(pet)) return;
    started.add(pet);
    createCircularCarousel(root, {
      items: PETS[pet].map((p) => ({ ...p, alt: p.title })),
      preset: "cylinder",
      intro: "rise",
      cardWidth: 240,
      aspectRatio: 0.75,
      gap: 22,
      speed: 14,
      minCards: 8,
      cornerRadius: 0,
      fadeColor: "#030503",
      captions: true,
    });
  });
}

document.addEventListener("slidechange", maybeStart);
maybeStart();
