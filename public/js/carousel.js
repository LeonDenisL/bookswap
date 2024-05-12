$(document).ready(function () {
  $(".carousel").slick({
    slidesToShow: 1, // Define quantos slides serão exibidos por vez
    slidesToScroll: 1, // Define quantos slides serão percorridos por vez
    autoplay: true, // Define se o carrossel será iniciado automaticamente
    autoplaySpeed: 2000, // Define a velocidade de rotação do carrossel em milissegundos
    prevArrow: '<button type="button" class="slick-prev">Previous</button>', // Define o botão de navegação para o slide anterior
    nextArrow: '<button type="button" class="slick-next">Next</button>', // Define o botão de navegação para o próximo slide
    responsive: [
      // Define as configurações responsivas do carrossel
      {
        breakpoint: 768, // Define o ponto de quebra em que as configurações abaixo serão aplicadas
        settings: {
          slidesToShow: 1, // Define quantos slides serão exibidos por vez para telas menores
          slidesToScroll: 1, // Define quantos slides serão percorridos por vez para telas menores
        },
      },
    ],
  });
});
