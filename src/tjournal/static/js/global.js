const pagesInHistory = {};
let $ajax = $.ajax; // save old ajax method
$.ajax = function (arguments, storerAjaxCall = false) {
    // if page load ajax call
    if (!storerAjaxCall) {
        for (let i in pagesInHistory) {
            delete pagesInHistory[i];
        }
    }
    return $ajax(arguments);
};



function debounce(fn, delay) {
    var timer = null;
    return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(context, args);
        }, delay);
    };
}

function showAlert(message = 'Something went wrong', period = 3000) {
    const alertContainer = $('.l-alert-c');
    const alertContainerFluid = $('.l-alert-fluid');
    const fluidId = `${alertContainerFluid.length + 1}-alert-fluid`;

    alertContainer.removeClass('d-none');

    alertContainer.prepend(`<div class="l-alert-fluid px-3 py-3 mt-3" id="${fluidId}">
        <span>${message}</span>
    </div>`);

    $(document).on('click', `#${fluidId}`, (e) => {
        $('#' + fluidId).remove();
    });

    let interval = setInterval(() => {
        $('#' + fluidId).remove();
        clearTimeout(interval);
    }, period);
}

/* When the user clicks on the button,
toggle between hiding and showing the dropdown content */
function showDropdown(id) {
    for (let i of $('.dropdown')) {
        $(i).find('.dropdown-content').removeClass('show-dropdown');
    }
    document.getElementById(id).classList.toggle("show-dropdown");
}

function hideAllDropdown() {
    for (let i of $('.dropdown')) {
        $(i).find('.dropdown-content').removeClass('show-dropdown');
    }
}

// Close the dropdown menu if the user clicks outside of it
window.onclick = function (event) {
    let node = event.target;
    let des = false;
    if (node.classList.toString().includes('dropdown') || $(node).parents(".dropdown").length) {
        des = true;
    }
    if (!event.target.matches('.dropbtn') && des === false) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show-dropdown')) {
                openDropdown.classList.remove('show-dropdown');
            }
        }
    }
}

// tabs
var button = document.querySelector('tab-btn');
$(document).on('click', '.tab-btn', (e) => {
    var container = $(e.target).parent().find('.c_scroll')[0];
    sideScroll(container, 'left', 25, 300, 10);
});

var back = document.querySelector('tab-btn-back');
$(document).on('click', '.tab-btn-back', (e) => {
    var container = $(e.target).parent().find('.c_scroll')[0];
    sideScroll(container, 'right', 25, 300, 10);
});

function sideScroll(element, direction, speed, distance, step) {
    let scrollAmount = 100;
    var slideTimer = setInterval(function () {
        if (direction == 'left') {
            element.scrollLeft -= step;
        } else {
            element.scrollLeft += step;
        }
        scrollAmount += step;
        if (scrollAmount >= distance) {
            window.clearInterval(slideTimer);
        }
    }, speed);
}


function pageLoadError() {
    let errMarkUp = `
        <div>
            <div class="d-block">
                <h5>Something went wrong</h5>
            </div>
            <div class="d-block text-center">
                <a href="" class="transp-btn d-inline-block bg-white btn-bx-s anchor_samepage_exception">Retry</a>
            </div>
        </div>
        `;
    $('#content').html(
        `<div style="display: flex;justify-content: center;" class="py-5">${errMarkUp}</div>`
    );
}

function show404Page() {
    let errMarkUp = `
        <div class="mt-4 text-center">
            <h1 style="font-size: 10em;user-select: none;">404</h1>
            <span style="user-select: none;">Page not found</span>
        </div>
        `;
    $('#content').html(
        `<div style="display: flex;justify-content: center;" class="py-5">${errMarkUp}</div>`
    );
}

function reShowUtil() {
    // end progress bar animation
    // just wait for half a second
    // before hiding the progress bar
    // so users can see it reach the end
    let inter = setInterval(() => {
        $('#loader').css({
            'width': '0%',
        });
        clearInterval(inter);
    }, 500);
}


function render(rendered_elements) {
    let contentMarkup;
    let changedHeadMarkup = ``;
    let asideLeftMarkup;
    rendered_elements.forEach(element => {
        if (element.id == 'content') {
            for (let i of element.childNodes) {
                if (i.id == 'fluid') {
                    contentMarkup = i;
                }
            }
        } else if (element.id == 'change') {
            changedHeadMarkup = element;
        } else if (element.nodeName.toLowerCase() == 'title') {
            $('title').text(element.innerText);
        } else if (String(element.classList).includes('aside_left')) {
            asideLeftMarkup = $(element).find('div.aside_left_child');
        }
    });

    $('body').addClass('d-none');
    $('#change').html(changedHeadMarkup.innerHTML);
    $('body').removeClass('d-none');

    $('#content').html(contentMarkup);

    $('.aside_left').html('');
    for (let i of asideLeftMarkup) {
        $('.aside_left').append(i);
    }

    $('body')[0].scrollIntoView();
    reShowUtil();
}

// comment vars
let requesting = false;
let received = 0;
let loadMore = true;
let order = 'first';
// post vars
let requesting_posts = false;
let received_posts = 0;
let loadMore_posts = true;

function loadPage(href_, pushed = true) {
    if (!pushed && href_ != location.href) {
        history.pushState('', '', href_);
    }
    const progressBar = $('#loader');

    hideAllDropdown();

    let rendered_html, rendered_elements;

    // reset comment variables
    requesting = false;
    received = 0;
    loadMore = true;
    // reset post variables
    requesting_posts = false;
    received_posts = 0;
    loadMore_posts = true;

    if (pagesInHistory[location.href] != undefined) {
        rendered_elements = $.parseHTML(pagesInHistory[location.href]);
        render(rendered_elements);
        return; // so that it does not do a ajax call
    }

    $.ajax({
        url: href_,
        method: 'GET',
        success: (template_html) => {
            rendered_html = Mustache.render(template_html, {});
            rendered_elements = $.parseHTML(rendered_html);

            pagesInHistory[location.href] = rendered_html;
            rendered_html = null;

            render(rendered_elements);
        },
        error: (jqXHR) => {
            if (jqXHR.status == 404) {
                show404Page();
            } else {
                pageLoadError();
            }
            reShowUtil();
        },
        xhr: () => {
            let xhr = new window.XMLHttpRequest();

            xhr.addEventListener("progress", function (evt) {
                let percentComplete = Math.floor((evt.loaded / evt.total) * 100);
                progressBar.css({
                    'width': `${percentComplete}%`,
                });
            }, true);

            return xhr;
        },
    }, true);
}

$(document).on('click', 'a', (e) => {
    e.preventDefault();
    let element = e.target;
    while (element.nodeName.toString().toLowerCase() !== 'a') {
        element = element.parentElement;
    }
    let href_ = element.href.toString();
    if ($(element).attr('target') != undefined) {
        window.open(href_, $(element).attr('target')).focus();
        return;
    }
    if (element.classList.toString().includes('anchor-reload')) {
        location.href = href_;
        return;
    }

    if (href_ == window.location && !element.classList.toString().includes('anchor_samepage_exception')) {
        return;
    }

    if (element.classList.toString().includes('anchor_samepage_exception')) {
        loadPage(href_);
        return;
    }

    if (history && history.pushState) {
        try {
            history.pushState('', '', href_);
            /*
                keep the below statement always below, very important
                Why, because -> if there is a website with another domain,
                then it will give error and will go to the catch statement
                But if below statement is written above the history.pushState
                then it will try to load that page, still the catch statement
                will be executed, but retry page will be shown
            */
            loadPage(href_);
        } catch {
            window.open(href_);
        }
    } else {
        location.href = href_;
    }
});

window.onpopstate = function (e) {
    e.preventDefault();
    let u = new URL(location.href);
    if (!u.hash) {
        loadPage(location.href);
    }
};


function askUser(head, text, handler) {
    hideAllDropdown();
    $('#askUserBtns').html(`
        <button id="askUserNo" class="transp-btn btn-bx-s mx-1 px-4">No</button>
        <button id="askUserYes" class="transp-btn btn-bx-s px-4 text-white bg-danger">Yes</button>
    `);

    $('#askUserModal').modal('show');
    $('#askUserPromptHead').text(head);
    $('#askUserPromptText').text(text);

    //Pass true to a callback function
    $("#askUserYes").click(function () {
        handler(true);
        $("#askUserModal").modal("hide");
        $('#askUserBtns').html(``);
    });

    //Pass false to callback function
    $("#askUserNo").click(function () {
        handler(false);
        $("#askUserModal").modal("hide");
        $('#askUserBtns').html(``);
    });
}

function inputUser(head, text, handler) {
    hideAllDropdown();
    $('#askUserBtns').html(`
        <form id="inputUser_form">
            <input placeholder="${text}" id="inputUser_">
            <button type="submit" class="text-white mt-3 transp-btn blue_button btn-bx-s mx-1 px-4">Yes</button>
            <button id="inputUserCancel" type="reset" class="mt-3 transp-btn btn-bx-s mx-1 px-4">Cancel</button>
        </form>
    `);

    $('#askUserModal').modal('show');
    $('#askUserPromptHead').text(head);
    $('#askUserPromptText').text(text);

    //Pass true to a callback function
    $("#inputUser_form").submit(function (e) {
        e.preventDefault();
        if ($('#inputUser_').val().trim().length) {
            handler(true, $('#inputUser_').val());
            $("#askUserModal").modal("hide");
            $('#askUserBtns').html(``);
        }
    });

    //Pass false to callback function
    $("#inputUserCancel").click(function () {
        handler(false, null);
        $("#askUserModal").modal("hide");
        $('#askUserBtns').html(``);
    });
}


function convertDateRelevant(date) {
    let month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let date_ = date.split('-');
    return `${month[Number(date_[1]) - 1]}. ${date_[2]}, ${date_[0]}`;
}