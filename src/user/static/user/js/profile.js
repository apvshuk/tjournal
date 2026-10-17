function uploadPhoto(str) {
	let uploadElem = document.getElementById(`${str}_update`);
	let blobUrl = URL.createObjectURL(uploadElem.files[0]);
	$('#drag-image').attr('src', blobUrl);
	$('#drag-image').on('load', (e) => {
		$('.update-img-container').removeClass('d-none');
		initCropper(str);
	});
}


$(document).on('change', '#avatar_update', e => {
	uploadPhoto('avatar');
});

$(document).on('change', '#cover_update', e => {
	uploadPhoto('cover');
});

function initCropper(str) {
	$(window).scrollTop($('.update-img-container').offset().top);
	let image = document.getElementById('drag-image');
	let ratio = 1 / 1;
	if (str == 'cover') {
		ratio = 16/5;
	}

	let cropper;
	if (image.classList.contains("cropper-hidden")) {
		image.cropper.destroy();
		$('#drag-image').on('load', (e) => {
			cropper = new Cropper(image, {
				aspectRatio: ratio,
			});
		});
	} else {
		cropper = new Cropper(image, {
			aspectRatio: ratio,
		});
	}

	// On crop button clicked
	document.getElementById('crop-submit').addEventListener('click', function () {
		$('.update-img-container').addClass('d-none');
		cropper.getCroppedCanvas().toBlob(function (blob) {
			let formData = new FormData();
			formData.append('file', blob, `${str}.jpg`);
			formData.append('csrfmiddlewaretoken', $('input[name=csrfmiddlewaretoken]').val());

			$.ajax({
				url: `/update-${str}/`,
				method: "POST",
				data: formData,
				processData: false,
				contentType: false,
				success: function (data) {
					try {
						if (str == 'avatar') {
							document.querySelector('#avatar_uni').src = data.url;
							showAlert('Avatar updated');
						} else if (str == 'cover') {
							document.querySelector('#cover_uni').src = data.url;
							showAlert('Cover art updated');
						}
						$(window).scrollTop(0);
					} catch ( TypeError ) {
						location.reload();
					}
				},
				error: function () {
					showAlert();
				}
			});
		});
	});
}


// post fetching
function fetchPost(container, userpk) {
	if (container[0] != undefined && !requesting_posts && loadMore_posts) {
		requesting_posts = true;
		$.ajax({
			method: "POST",
			url: `/fetch-post/${userpk}/`,
			data: {
				csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
				received: received_posts,
				order: $('.filter').data('order'),
			},
			success: (data) => {
				let posts = $.parseHTML(data.posts);
				requesting_posts = false;
				received_posts += data.sent;
				container.append(posts);

				// hide the spinner
				$('#postsLoader').addClass('d-none');

				if (data.sent == 0 && received_posts == 0) {
					loadMore_posts = false;
					container.append(`<span class="user-select-none text-center d-block">No posts yet</span>`);
					return;
				} else if (data.sent == 0) {
					loadMore_posts = false;
                    return;
                }

				// change the text and show the button to load more
				$('#loadPostsBtn').val('Load more');
				$('#loadPostsBtn').show();
			},
			error: () => {
				requesting_posts = false; // make the flags false, so as to not load posts on scroll, only load on retry click
				loadMore_posts = false; // make the flags false, so as to not load posts on scroll, only load on retry click

				// hide the spinner
				$('#postsLoader').addClass('d-none');

				// change button text to retry and show the button
				$('#loadPostsBtn').val('Retry');
				$('#loadPostsBtn').show();
				$('#loadPostsBtn')[0].onclick = () => {loadMore_posts = true;loadPost()};
			},
			beforeSend: () => {
				$('#loadPostsBtn').hide();
				$('#postsLoader').removeClass('d-none');
			},
		}, true);
	}
}

// comment fetching
function fetchComment_(container, userpk) {
	if (container[0] != undefined && !requesting_posts && loadMore_posts) {
		requesting_posts = true;
		$.ajax({
			method: "POST",
			url: `/fetch-comment-user/${userpk}/`,
			data: {
				csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
				received: received_posts,
				order: $('.filter').data('order'),
			},
			success: (data) => {
				// code to populate the container with comments
				let comments = $.parseJSON(data.comments);

				// hide the spinner
				$('#commentsLoader').addClass('d-none');

                if (comments.length == 0 && received_posts == 0) {
                    $('#commentLoader').remove();
                    loadMore_posts = false;
					container.append(`<span class="user-select-none text-center d-block">No comments yet</span>`);
					return;
                } else if (comments.length == 0) {
					loadMore_posts = false;
                    return;
				}
                let usersDets = $.parseJSON(data.user_dets);
                let profilesDets = $.parseJSON(data.profiles_dets);
                let votes = data.votes;

                renderComment(comments, usersDets, profilesDets, votes, (markup, container) => {
                    $('#commentLoader').remove();
                    container.append(markup);
                    requesting = false;
                    received += comments.length;

                    unrenderedReplies = [];

					requesting_posts = false;
					received_posts += comments.length;

					// change the text and show the button to load more
					$('#loadCommentsBtn').val('Load more');
					$('#loadCommentsBtn').show();
                }, '', data.authenticated, container);
			},
			error: () => {
				requesting_posts = false; // make the flags false, so as to not load posts on scroll, only load on retry click
				loadMore_posts = false; // make the flags false, so as to not load posts on scroll, only load on retry click

				// hide the spinner
				$('#commentsLoader').addClass('d-none');

				// change button text to retry and show the button
				$('#loadCommentsBtn').val('Retry');
				$('#loadCommentsBtn').show();
				$('#loadCommentsBtn')[0].onclick = () => {loadMore_posts = true;loadComment()};
			},
			beforeSend: () => {
				$('#loadCommentsBtn').hide();
				$('#commentsLoader').removeClass('d-none');
			},
		}, true);
	}
}
function loadPost(action_empty=false) {
	let postContainer = $('.main_content_fluid');
    let pk = postContainer.data('userpk');
	if (action_empty) {
		postContainer.html('');
	}
	fetchPost(postContainer, pk);
}
function loadComment(action_empty=false) {
	let postContainer = $('.main_content_fluid');
    let pk = postContainer.data('userpk');
	if (action_empty) {
		postContainer.html('');
	}
	fetchComment_(postContainer, pk);
}
// post / comment loading
$(window).scroll(function () {
	if ($(window).scrollTop() + $(window).height() > $(document).height() - 500) {
		let pageName = $('.datapage').data('page');
		if (pageName === 'articles') {
			loadPost();
		} else if (pageName === 'comments') {
			loadComment();
		}
    }
});


// subscribe a user
$(document).on('click', '.subscribe-btn', (e) => {
	let subscribeTo = e.target.dataset['subscribetopk'];
	let elem = $(`.subscribe-btn-${subscribeTo}`);
	$.ajax({
		method: "POST",
		url: `/subscribe/${subscribeTo}/`,
		data: {
			csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val(),
			userpk: subscribeTo,
		},
		success: (data) => {
			$(`.notification-bell-user-${subscribeTo}`).remove();
			if (data.subscribed) {
				elem.addClass('unsubscribe-hover');
				elem.find('i').addClass('unsubscribe-hover-i');
				elem.find('span').addClass('unsubscribe-hover-span');

				elem.find('span').text('Subscribed');
				elem.find('i').removeClass('fa-times');
				elem.find('i').addClass('fa-check');
				elem.find('i').addClass('text-success');
				elem.find('i').removeClass('fa-user-plus');
				$(`.notification-container-${subscribeTo}`).html(`
					<button class="notification-bell-user notification-bell-user-${subscribeTo} transp-btn btn-bx-s bg-white px-3"><i class="far fa-bell my-auto"></i></button>
				`);
			} else {
				elem.removeClass('unsubscribe-hover');
				elem.find('i').removeClass('unsubscribe-hover-i');
				elem.find('i').removeClass('text-danger');
				elem.find('i').removeClass('text-success');
				elem.find('span').removeClass('unsubscribe-hover-span');

				elem.find('span').text('Subscribe to');
				elem.find('i').addClass('fa-user-plus');
				elem.find('i').removeClass('fa-check text-success');
			}
			showAlert(data.message);
			elem.attr('disabled', false);
		},
		error: (error) => {
			showAlert(error.message);
			elem.attr('disabled', false);
		},
		beforeSend: () => {
			elem.attr('disabled', true);
		},
	});
});

$(document).on('mouseover', '.unsubscribe-hover', (e) => {
	$(e.target).find('i').addClass('text-danger');
	$(e.target).find('i').removeClass('text-success');
	$(e.target).find('i').addClass('fa-times');
	$(e.target).find('i').removeClass('fa-check');
});
$(document).on('mouseover', '.unsubscribe-hover-span', (e) => {
	$(e.target).parent().find('i').addClass('text-danger');
	$(e.target).parent().find('i').removeClass('text-success');
	$(e.target).parent().find('i').addClass('fa-times');
	$(e.target).parent().find('i').removeClass('fa-check');
});
$(document).on('mouseover', '.unsubscribe-hover-i', (e) => {
	$(e.target).addClass('text-danger');
	$(e.target).removeClass('text-success');
	$(e.target).addClass('fa-times');
	$(e.target).removeClass('fa-check');
});

$(document).on('mouseout', '.unsubscribe-hover', (e) => {
	$(e.target).find('i').addClass('text-success');
	$(e.target).find('i').removeClass('text-danger');
	$(e.target).find('i').addClass('fa-check');
	$(e.target).find('i').removeClass('fa-times');
});
$(document).on('mouseout', '.unsubscribe-hover-span', (e) => {
	$(e.target).parent().find('i').addClass('text-success');
	$(e.target).parent().find('i').removeClass('text-danger');
	$(e.target).parent().find('i').addClass('fa-check');
	$(e.target).parent().find('i').removeClass('fa-times');
});
$(document).on('mouseout', '.unsubscribe-hover-i', (e) => {
	$(e.target).addClass('text-success');
	$(e.target).removeClass('text-danger');
	$(e.target).addClass('fa-check');
	$(e.target).removeClass('fa-times');
});
