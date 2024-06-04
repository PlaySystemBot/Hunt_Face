document.addEventListener('DOMContentLoaded', () => {
    "use strict";
    const preloader = document.querySelector('#preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            preloader.remove();
        });
    }
    const selectHeader = document.querySelector('#header');
    if (selectHeader) {
        document.addEventListener('scroll', () => {
            window.scrollY > 100 ? selectHeader.classList.add('sticked') : selectHeader.classList.remove('sticked');
        });
    }
    let navbarlinks = document.querySelectorAll('#navbar .scrollto');

    function navbarlinksActive() {
        navbarlinks.forEach(navbarlink => {
            if (!navbarlink.hash) return;
            let section = document.querySelector(navbarlink.hash);
            if (!section) return;
            let position = window.scrollY;
            if (navbarlink.hash != '#header') position += 200;
            if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
                navbarlink.classList.add('active');
            } else {
                navbarlink.classList.remove('active');
            }
        })
    }
    window.addEventListener('load', navbarlinksActive);document.addEventListener('scroll', navbarlinksActive);

    function scrollto(el) {
        const selectHeader = document.querySelector('#header');
        let offset = 0;
        if (selectHeader.classList.contains('sticked')) {
            offset = document.querySelector('#header.sticked').offsetHeight;
        } else if (selectHeader.hasAttribute('data-scrollto-offset')) {
            offset = selectHeader.offsetHeight - parseInt(selectHeader.getAttribute('data-scrollto-offset'));
        }
        window.scrollTo({
            top: document.querySelector(el).offsetTop - offset,
            behavior: 'smooth'
        });
    }
    let selectScrollto = document.querySelectorAll('.scrollto');selectScrollto.forEach(el => el.addEventListener('click', function(event) {
        if (document.querySelector(this.hash)) {
            event.preventDefault();
            let mobileNavActive = document.querySelector('.mobile-nav-active');
            if (mobileNavActive) {
                mobileNavActive.classList.remove('mobile-nav-active');
                let navbarToggle = document.querySelector('.mobile-nav-toggle');
                navbarToggle.classList.toggle('bi-list');
                navbarToggle.classList.toggle('bi-x');
            }
            scrollto(this.hash);
        }
    }));window.addEventListener('load', () => {
        if (window.location.hash) {
            if (document.querySelector(window.location.hash)) {
                scrollto(window.location.hash);
            }
        }
    });
    const mobileNavToogle = document.querySelector('.mobile-nav-toggle');
    if (mobileNavToogle) {
        mobileNavToogle.addEventListener('click', function(event) {
            event.preventDefault();
            document.querySelector('body').classList.toggle('mobile-nav-active');
            this.classList.toggle('bi-list');
            this.classList.toggle('bi-x');
        });
    }
    const navDropdowns = document.querySelectorAll('.navbar .dropdown > a');navDropdowns.forEach(el => {
        el.addEventListener('click', function(event) {
            if (document.querySelector('.mobile-nav-active')) {
                event.preventDefault();
                this.classList.toggle('active');
                this.nextElementSibling.classList.toggle('dropdown-active');
                let dropDownIndicator = this.querySelector('.dropdown-indicator');
                dropDownIndicator.classList.toggle('bi-chevron-up');
                dropDownIndicator.classList.toggle('bi-chevron-down');
            }
        })
    });
    let heroCarouselIndicators = document.querySelector('#hero .carousel-indicators');
    if (heroCarouselIndicators) {
        let heroCarouselItems = document.querySelectorAll('#hero .carousel-item')
        heroCarouselItems.forEach((item, index) => {
            if (index === 0) {
                heroCarouselIndicators.innerHTML += `<li data-bs-target="#hero" data-bs-slide-to="${index}" class="active"></li>`;
            } else {
                heroCarouselIndicators.innerHTML += `<li data-bs-target="#hero" data-bs-slide-to="${index}"></li>`;
            }
        });
    }
    const scrollTop = document.querySelector('.scroll-top');
    if (scrollTop) {
        const togglescrollTop = function() {
            window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
        }
        window.addEventListener('load', togglescrollTop);
        document.addEventListener('scroll', togglescrollTop);
        scrollTop.addEventListener('click', window.scrollTo({
            top: 0,
            behavior: 'smooth'
        }));
    }
    const glightbox = GLightbox({
        selector: '.glightbox'
    });
    let portfolionIsotope = document.querySelector('.portfolio-isotope');
    if (portfolionIsotope) {
        let portfolioFilter = portfolionIsotope.getAttribute('data-portfolio-filter') ? portfolionIsotope.getAttribute('data-portfolio-filter') : '*';
        let portfolioLayout = portfolionIsotope.getAttribute('data-portfolio-layout') ? portfolionIsotope.getAttribute('data-portfolio-layout') : 'masonry';
        let portfolioSort = portfolionIsotope.getAttribute('data-portfolio-sort') ? portfolionIsotope.getAttribute('data-portfolio-sort') : 'original-order';
        window.addEventListener('load', () => {
            let portfolioIsotope = new Isotope(document.querySelector('.portfolio-container'), {
                itemSelector: '.portfolio-item',
                layoutMode: portfolioLayout,
                filter: portfolioFilter,
                sortBy: portfolioSort
            });
            let menuFilters = document.querySelectorAll('.portfolio-isotope .portfolio-flters li');menuFilters.forEach(function(el) {
                el.addEventListener('click', function() {
                    document.querySelector('.portfolio-isotope .portfolio-flters .filter-active').classList.remove('filter-active');
                    this.classList.add('filter-active');
                    portfolioIsotope.arrange({
                        filter: this.getAttribute('data-filter')
                    });
                    if (typeof aos_init === 'function') {
                        aos_init();
                    }
                }, false);
            });
        });
    }
    new Swiper('.clients-slider', {
        speed: 400,
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false
        },
        slidesPerView: 'auto',
        breakpoints: {
            320: {
                slidesPerView: 2,
                spaceBetween: 40
            },
            480: {
                slidesPerView: 3,
                spaceBetween: 60
            },
            640: {
                slidesPerView: 4,
                spaceBetween: 80
            },
            992: {
                slidesPerView: 6,
                spaceBetween: 120
            }
        }
    });new Swiper('.testimonials-slider', {
        speed: 600,
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false
        },
        slidesPerView: 'auto',
        pagination: {
            el: '.swiper-pagination',
            type: 'bullets',
            clickable: true
        }
    });new Swiper('.portfolio-details-slider', {
        speed: 600,
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false
        },
        slidesPerView: 'auto',
        pagination: {
            el: '.swiper-pagination',
            type: 'bullets',
            clickable: true
        }
    });

    function aos_init() {
        AOS.init({
            duration: 1000,
            easing: 'ease-in-out',
            once: true,
            mirror: false
        });
    }
    window.addEventListener('load', () => {
        aos_init();
    });$('#subscribeBtn').on('click', function() {
        $('.status').html('');
        var regEmail = /^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,4}$/i;
        var email = $('#subscribeEmail');
        if (email.val().trim() == '') {
            $('#subscribeStatusError').html('Пожалуйста, введите ваш email.');
            email.focus();
            return false;
        } else if (email.val().trim() != '' && !regEmail.test(email.val())) {
            $('#subscribeStatusError').html('Пожалуйста, введите корректный email.');
            email.focus();
            return false;
        } else {
            $.ajax({
                type: 'POST',
                url: 'assets/php/subscribe.php',
                dataType: "json",
                data: {
                    subscribe: 1,
                    email: email.val()
                },
                beforeSend: function() {
                    $('#subscribeBtn').attr("disabled", "disabled");
                    $('.php-email-form').css('opacity', '.5');
                },
                success: function(data) {
                    if (data.status == '1') {
                        $('#subsFrm')[0].reset();
                        $('#subscribeStatusOk').html(data.msg);
                    } else {
                        $('#subscribeStatusError').html(data.msg);
                    }
                    $('#subscribeBtn').removeAttr("disabled");
                    $('.php-email-form').css('opacity', '');
                },
                error: function(error) {
                    $('#subscribeStatusError').html('Непредвиденная ошибка.');
                    $('#subscribeBtn').removeAttr("disabled");
                    $('.php-email-form').css('opacity', '');
                }
            });
        }
    });$('#loginBtn').on('click', function() {
        $('#loginStatusError').html('');
        var regEmail = /^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,4}$/i;
        var email = $('#loginEmail');
        var password = $('#loginPassword');
        if (email.val().trim() == '') {
            $('#loginStatusError').html('Пожалуйста, введите ваш email.');
            email.focus();
            return false;
        } else if (email.val().trim() != '' && !regEmail.test(email.val())) {
            $('#loginStatusError').html('Пожалуйста, введите корректный email.');
            email.focus();
            return false;
        } else if (password.val().trim() == '') {
            $('#loginStatusError').html('Пожалуйста, введите ваш пароль.');
            password.focus();
            return false;
        } else {
            $.ajax({
                type: 'POST',
                url: 'assets/php/login.php',
                dataType: "json",
                data: {
                    login: 1,
                    email: email.val(),
                    password: password.val()
                },
                beforeSend: function() {
                    $('#loginBtn').attr("disabled", "disabled");
                    $('#loginFrm').css('opacity', '.5');
                },
                success: function(data) {
                    if (data.status == '1') {
                        return true;
                    } else {
                        $('#loginStatusError').html(data.msg);
                    }
                    $('#loginBtn').removeAttr("disabled");
                    $('#loginFrm').css('opacity', '');
                },
                error: function(error) {
                    $('#loginStatusError').html('Непредвиденная ошибка.');
                    $('#loginBtn').removeAttr("disabled");
                    $('#loginFrm').css('opacity', '');
                }
            });
            return false;
        };
    });$('#optoutBtn').on('click', function() {
        $('.status').html('');
        var regEmail = /^[A-Z0-9._%+-]+@([A-Z0-9-]+\.)+[A-Z]{2,4}$/i;
        var email = $('#optoutEmail');
        var name = $('#optoutName');
        var message = $('#optoutMessage');
        if (name.val().trim() == '') {
            $('#optoutStatusError').html('Пожалуйста, введите ваше имя.');
            name.focus();
            return false;
        } else if (email.val().trim() == '') {
            $('#optoutStatusError').html('Пожалуйста, введите ваш email.');
            email.focus();
            return false;
        } else if (email.val().trim() != '' && !regEmail.test(email.val())) {
            $('#optoutStatusError').html('Пожалуйста, введите корректный email.');
            email.focus();
            return false;
        } else if (message.val().trim() == '') {
            $('#optoutStatusError').html('Пожалуйста, введите сообщение.');
            message.focus();
            return false;
        } else {
            $.ajax({
                type: 'POST',
                url: 'assets/php/optout.php',
                dataType: "json",
                data: {
                    optout: 1,
                    name: name.val(),
                    email: email.val(),
                    message: message.val()
                },
                beforeSend: function() {
                    $('#optoutBtn').attr("disabled", "disabled");
                    $('.php-email-form').css('opacity', '.5');
                },
                success: function(data) {
                    if (data.status == '1') {
                        $('#optoutFrm')[0].reset();
                        $('#optoutStatusOk').html(data.msg);
                    } else {
                        $('#optoutStatusError').html(data.msg);
                    }
                    $('#optoutBtn').removeAttr("disabled");
                    $('.php-email-form').css('opacity', '');
                },
                error: function(error) {
                    $('#optoutStatusError').html('Непредвиденная ошибка.');
                    $('#optoutBtn').removeAttr("disabled");
                    $('.php-email-form').css('opacity', '');
                }
            });
        }
    });$('body').on('shown.bs.modal', '#modalLoginForm', function() {
        $('#loginStatusError').html('');
        $('#loginEmail').trigger('focus')
    });$('select').selectpicker();
});

$(document).ready(function() {
    function showModal(message, redirectUrl = null) {
        var modalHtml = `
            <div class="modal fade" id="messageModal" tabindex="-1" aria-labelledby="messageModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="messageModalLabel">Сообщение</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            ${message}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        $('body').append(modalHtml);
        var modal = new bootstrap.Modal(document.getElementById('messageModal'));
        modal.show();
        $('#messageModal').on('hidden.bs.modal', function (e) {
            $(this).remove();
            if (redirectUrl) {
                window.location.href = redirectUrl;
            }
        });
    }

    $('form').submit(function(event) {
        event.preventDefault();
        var $form = $(this);
        $.ajax({
            url: $form.attr('action'),
            type: $form.attr('method'),
            data: new FormData(this),
            processData: false,
            contentType: false,
            success: function(response) {
                if ($form.closest('.modal').length) {
                    $form.closest('.modal').modal('hide');
                }
                showModal(response.message, response.redirect_url);
            },
            error: function(response) {
                if ($form.closest('.modal').length) {
                    $form.closest('.modal').modal('hide');
                }
                showModal(response.responseJSON.message || 'Произошла ошибка на сервере.');
            }
        });
    });

    // Обработка выхода
    $('#logoutButton').click(function(event) {
        event.preventDefault();
        $.ajax({
            url: '/logout',
            type: 'GET',
            success: function(response) {
                showModal(response.message, response.redirect_url);
            },
            error: function(response) {
                showModal(response.responseJSON.message || 'Произошла ошибка на сервере.');
            }
        });
    });
});





