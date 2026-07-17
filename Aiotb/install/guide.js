(async function () {
    const images = [...document.querySelectorAll('img[data-b64]')];

    await Promise.all(images.map(async (image) => {
        const base = image.dataset.b64;
        const partCount = Number(image.dataset.parts || 1);

        try {
            const parts = await Promise.all(
                Array.from({ length: partCount }, (_, index) =>
                    fetch(`assets/${base}.b64.${index + 1}`).then((response) => {
                        if (!response.ok) throw new Error(`Unable to load ${base}`);
                        return response.text();
                    })
                )
            );

            image.src = `data:image/webp;base64,${parts.join('').trim()}`;
        } catch (error) {
            image.alt = `${image.alt} (image unavailable)`;
            image.closest('figure')?.classList.add('is-image-error');
        }
    }));
})();
