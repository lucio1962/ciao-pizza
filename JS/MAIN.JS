// Animazioni base
document.addEventListener('DOMContentLoaded', function() {
    console.log('Ciao Calderino - Sito in costruzione!');
    
    // Animazione pulsanti
    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 150);
        });
    });
});
