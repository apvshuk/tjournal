const leftSidebar = $('.aside_left');
const rightSidebar = $('.aside_right');

$(document).on('click', '.toggleSidebar', (e) => {
    if (leftSidebar[0].classList.toString().includes('d-none')) {
        $(':root').css({
            '--leftsidebar-width': '240px',
        });
        leftSidebar.removeClass('d-none');
    } else {
        $(':root').css({
            '--leftsidebar-width': '0px',
        });
        leftSidebar.addClass('d-none');
    }
});

$(document).on('click', '.toggleRightSidebar', (e) => {
    if ($('.aside_right__users')[0].classList.toString().includes('d-none')) {
        $('.aside_right__users').removeClass('d-none');
        $('.toggleRightSidebar').find('span').removeClass('d-none');
        $(':root').css({
            '--rightsidebar-width': '240px',
        });
        rightSidebarShow = true;
    } else {
        $('.aside_right__users').addClass('d-none');
        $('.toggleRightSidebar').find('span').addClass('d-none');
        $(':root').css({
            '--rightsidebar-width': '30px',
        });
        rightSidebarShow = true;
    }
    $('.toggleRightSidebar').find('i').toggleClass('fa-chevron-left');
    $('.aside_right__options').toggleClass('position-absolute');
});


function toggleLeftbar(x) {
    if (x.matches) { // If media query matches
        leftSidebar.addClass('d-none');
        rightSidebar.addClass('d-none');
    } else {
        leftSidebar.removeClass('d-none');
        rightSidebar.removeClass('d-none');
    }
}

function expireSidebar(x) {
    if (x.matches) { // If media query matches
        document.querySelector('.aside_left').addEventListener('click', (e) => {
            if (e.target.matches('.expire_sidebar')) {
                $('.toggleSidebar')[0].click();
            }
        });
    }
}

const x = window.matchMedia("(max-width: 1290px)");
toggleLeftbar(x);
expireSidebar(x);
x.addListener(toggleLeftbar);
x.addListener(expireSidebar);


// pinning users
$(document).on('click', '.pin-action', (e) => {
    const pk = Number(e.target.dataset['user_id']);
    const who = e.target.dataset['who'];
    $.ajax({
        url: `/u/${pk}/`,
        method: 'POST',
        data: {
            csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
            _name: 'toggle_pin',
            who: who,
            pk: pk,
        },
        success: (data) => {
            const pinState = data.state;
            const element = e.target.parentNode.parentNode;
            const parent = element.parentNode;
            if (pinState) {
                if (element != parent.children[0]) {
                    $(element).hide().show(300);
                }
                parent.removeChild(element);
                $(parent).prepend(element);
                e.target.style.color = '#0d6efd';
            } else {
                e.target.style.color = '#6c757d';
            }
            e.target.disabled = false;
        },
        error: () => {
            showAlert();
            e.target.disabled = false;
        },
        beforeSend: () => {
            e.target.disabled = true;
        }
    });
});

