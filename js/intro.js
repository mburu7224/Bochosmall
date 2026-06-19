(function () {
    const learnMoreButton = document.getElementById("learnMoreBtn");
    const featuresSection = document.getElementById("features");

    if (!learnMoreButton || !featuresSection) {
        return;
    }

    learnMoreButton.addEventListener("click", () => {
        featuresSection.scrollIntoView({ behavior: "smooth" });
    });
})();
