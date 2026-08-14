(function(){
	if(typeof document === 'undefined' || !document.getElementById) return;

	function init(){
		var box = document.getElementById('legend');
		var btn = document.getElementById('lg_toggle');
		if(!box || !btn) return;

		function isFixed(){
			if(!window.getComputedStyle) return false;
			return window.getComputedStyle(box).position === 'fixed';
		}

		function fitCollapsedWidth(){
			if(!isFixed()) return;
			var help = document.getElementById('help');
			if(!help) return;
			var w = Math.round(help.getBoundingClientRect().right -
			                   box.getBoundingClientRect().left);
			if(w > 0) box.style.setProperty('--lg-collapsed-w', w + 'px');
		}

		btn.addEventListener('click', function(){
			var collapsed = box.classList.toggle('is-collapsed');
			btn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
			if(collapsed) fitCollapsedWidth();
		});

		if(box.classList.contains('is-collapsed')) fitCollapsedWidth();

		if(typeof window !== 'undefined' && window.addEventListener){
			window.addEventListener('resize', function(){
				if(box.classList.contains('is-collapsed')) fitCollapsedWidth();
			});

			window.addEventListener('load', function(){
				if(box.classList.contains('is-collapsed')) fitCollapsedWidth();
			});
			if(document.fonts && document.fonts.ready && document.fonts.ready.then){
				document.fonts.ready.then(function(){
					if(box.classList.contains('is-collapsed')) fitCollapsedWidth();
				});
			}
		}
	}

	if(document.readyState === 'loading'){
		document.addEventListener('DOMContentLoaded', init);
	}else{
		init();
	}
})();
