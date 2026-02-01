// Archivo: signature.js

function printAsciiSignature() {
    // 1. Usamos tu SVG real convertido a Data URI.
    // He optimizado las rutas para que pesen poco y se vea el logo e isotipo.
    const svgData = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2548.67 1173.97'><path fill='%232f3957' d='M1489 400c-1 21 9 49 18 63l30-31c-2-5-7-14-7-34l-41 2zm41-11c2-15 7-26 13-36l-28-31c-14 18-24 41-26 71l41-3zm20-45c21-22 40-27 55-29l2-41c-29 2-63 15-86 41l29 29zm63-30c19 0 31 5 37 8l30-30c-16-10-39-19-67-19l0 41zm3 210c33 0 59-14 76-27l-32-27c-9 5-21 12-46 13 1 14 3 27 2 41zm-11-42c-24-3-43-14-58-33l-29 30c20 25 53 43 90 44-1-14-3-28-3-41zm134-91c-2-37-21-69-44-88l-30 29c17 14 30 33 32 58l42 2zm-41 6c0 30-14 52-30 66l31 27c23-21 41-56 40-93-14 0-27 0-41 0zm-215-108c-3-4-6-8-10-11-25 31-43 78-43 121s12 82 36 113c5-4 6-6 10-12-21-28-31-64-31-102s16-81 38-110zm131-74c-47 0-99 20-131 51 5 5 7 8 11 12 31-30 77-48 120-48 38 0 73 13 101 32 5-5 8-6 12-10-29-22-71-37-113-37zm127 299c3 3 8 8 11 11 26-32 47-81 47-126 0-48-18-92-49-125-1 5-5 9-10 11 27 30 44 70 44 113 0 41-18 86-42 115zm-16-14c-29 24-70 40-111 40-44 0-83-17-115-43-3 5-7 8-11 11 34 28 78 47 125 47 44 0 91-17 123-45-4-3-6-7-12-10zm-185-233c-3-4-6-7-10-12-44 44-72 118-72 184s26 130 65 177c4-4 6-7 10-12-37-44-60-103-60-165s29-129 67-173z' /></svg>`;

    // 2. Estilo CSS para mostrar la imagen de fondo
    const imageStyle = [
        'font-size: 1px;', 
        'padding: 80px 180px;',  // Ajusta el tamaño del logo aquí (Alto x Ancho)
        `background: url("${svgData}") no-repeat center center;`,
        'background-size: contain;',
        'line-height: 160px;' // Altura total
    ].join(' ');

    const titleStyle = [
        'color: #2f3957',
        'font-family: sans-serif',
        'font-size: 16px',
        'font-weight: 800',
        'margin-top: 10px'
    ].join(';');

    const textStyle = [
        'color: #555',
        'font-family: sans-serif',
        'font-size: 12px'
    ].join(';');

    // 3. Renderizado
    console.log('%c ', imageStyle); // Imprime el logo gráfico
    console.log('%cCAMBIOS ORION', titleStyle);
    console.log('%cPlataforma desarrollada por [Tu Nombre]', textStyle);
}