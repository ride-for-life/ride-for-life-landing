class Carousel {
  constructor(carouselContainer) {
    this.container = carouselContainer;
    this.element = this.container.querySelector('.carousel');
    this.images = this.element.querySelectorAll('img');
    this.container.style.width = 100 * this.images.length + '%';
    this.imageContainers = this.element.querySelectorAll('.carousel-img-container');
    this.imageContainers.forEach(i => i.style.width = 100 / this.images.length + '%');
    this.offset = this.minOffset();
    this.touchOrigin = { x: 0, y:  0};
    this.delta = 0;
    this.initButtons();

    this.resizeLock = false;
    window.addEventListener('resize', () => {
      if (!this.resizeLock) {
        this.resizeLock = true;
        this.element.classList.remove('carousel-snap');
        setTimeout(() => {
          this.setOffset(Math.round(this.offset / this.imageWidth()) * this.imageWidth());
          this.resizeLock = false;
        }, 150);
      }
    });

    this.element.addEventListener('touchstart', (e) => this.startTouchScroll(e), { passive: false });
  }
  // helper functions cannot be static attributes to avoid needing a resize event
  imageWidth() {
    return this.imageContainers[0].clientWidth;
  }
  maxOffset() {
    return this.imageWidth() * (this.imageContainers.length - 1);
  }
  minOffset() {
    return 0;
  }

  closestIndex() {
    return Math.round(this.offset / this.imageWidth());
  }

  setOffset(offset) {
    offset = Math.max(offset, this.minOffset());
    offset = Math.min(offset, this.maxOffset());
    this.offset = offset;
    this.element.style.transform = 'translateX(' + -this.offset + 'px)';
  }

  scrollNext() {
    this.element.classList.add('carousel-snap');
    this.scrollToIndex((this.closestIndex() + 1) % this.images.length);
    this.updateIndicator();
  }

  scrollPrev() {
    this.element.classList.add('carousel-snap');
    this.scrollToIndex((this.images.length + this.closestIndex() - 1) % this.images.length);
    this.updateIndicator();
  }

  initButtons() {
    this.prev = document.createElement('span');
    this.prev.classList.add('carousel-prev');
    this.prev.textContent = '❮';
    this.prev.addEventListener('click', () => this.scrollPrev());
    // this.prev.addEventListener('touchstart', (e) => this.startTouchScroll(e), { passive: false });
    this.next = document.createElement('span');
    this.next.classList.add('carousel-next');
    this.next.textContent = '❯';
    this.next.style.right = 100 - (100 / this.images.length) + '%';
    this.next.addEventListener('click', () => this.scrollNext());
    // passthrough touch events to carousel
    if (typeof TouchEvent === 'function') { // on supported browsers
      [this.prev, this.next].forEach(elem => {
        ['touchstart', 'touchmove', 'touchend'].forEach(eventType => {
          elem.addEventListener(eventType, e =>
                                this.element.dispatchEvent(new TouchEvent(e.type, e)));
        });
      });
    }
    this.container.appendChild(this.prev);
    this.container.appendChild(this.next);
    const indicatorsSpan = document.createElement('span');
    indicatorsSpan.classList.add('carousel-indicators');
    indicatorsSpan.style.width = (100 / this.images.length) + '%';
    this.indicators = [];
    this.images.forEach(_ => {
      const indicator = document.createElement('div');
      indicator.classList.add('carousel-indicator');
      indicatorsSpan.appendChild(indicator);
      this.indicators.push(indicator);
    });
    this.container.appendChild(indicatorsSpan);
    this.indicators[0].classList.add('carousel-indicator-show');
  }

  updateIndicator() {
    const closestIndex = this.closestIndex();
    if (!this.indicators[closestIndex].classList.contains('carousel-indicator-show')) {
      this.indicators.forEach(i => i.classList.remove('carousel-indicator-show'));
      this.indicators[closestIndex].classList.add('carousel-indicator-show');
    }
  }

  snapToImage() {
    this.element.classList.add('carousel-snap');
    const closestIndex = this.closestIndex();
    const distance = this.offset - (closestIndex * this.imageWidth());
    if (Math.abs(distance) >= this.imageWidth() / 5 ) {
      this.setOffset(this.imageWidth() * (closestIndex + (this.touchOrigin.x - this.lastLoc.x > 0 ? 1 : -1)));
    } else if (Math.abs(this.delta) > 20 && Math.sign(this.delta) * Math.sign(distance) >= 0) {
      // sign check makes sure we don't jump over an image on an aggressive scroll
      this.setOffset(this.imageWidth() * (closestIndex + (this.delta > 0 ? 1 : -1)));
    }
    else {
      this.setOffset(this.imageWidth() * closestIndex);
    }
    this.updateIndicator();
  }

  scrollToIndex(index) {
    this.setOffset(this.imageWidth() * index);
  }

  scrollBy(delta) {
    this.setOffset(this.offset + delta);
  }

  startTouchScroll(event) {
    this.element.classList.remove('carousel-snap');
    this.touchOrigin = {x: event.touches[0].pageX, y: event.touches[0].pageY};
    this.lastLoc = this.touchOrigin;
    const stopTouchScroll = ((event) => {
      this.element.removeEventListener('touchend', stopTouchScroll);
      this.element.removeEventListener('touchmove', touchMove);
      this.snapToImage();
      // scroll vertically only when there is more vertical than horizontal movement
      const distanceY = (this.touchOrigin.y - this.lastLoc.y);
      if (Math.abs(distanceY) > Math.abs(this.touchOrigin.x - this.lastLoc.x)) {
        window.scrollBy({
          top: Math.sign(distanceY) * Math.abs(distanceY) ** 1.3,
          behavior: 'smooth'
        });
      }
    });
    const touchMove = ((event) => {
      // prevent back/forward on mobile swipe, prevent default vertical scroll
      if (event.cancelable) { event.preventDefault(); }
      const touchLoc = { x: event.changedTouches[0].pageX, y: event.changedTouches[0].pageY};
      this.delta = this.lastLoc.x - touchLoc.x;
      this.scrollBy(this.delta);
      this.lastLoc = touchLoc;
    });
    this.element.addEventListener('touchend', stopTouchScroll);
    this.element.addEventListener('touchmove', touchMove);
  }
}

// Initialize carousels
const carousels = document.querySelectorAll('.carousel-container');
carousels.forEach(carousel => new Carousel(carousel));

// Lazy image loading
if (typeof LazyLoad !== 'undefined') {
    var lazyLoadInstance = new LazyLoad({
        elements_selector: "img"
    });
}

// about person expand/contract
const personInfos = document.querySelectorAll('.people .person .person-info');
personInfos.forEach(elem => {
    let expanded = false;
    elem.addEventListener('click', () => {
        if (expanded) {
            elem.style.height = elem.scrollHeight + 'px';
            elem.classList.remove('expanded');
            setTimeout(() => elem.style.height = null, 20);
        } else {
            elem.style.height = elem.scrollHeight + 'px';
            elem.addEventListener('transitionend', () => {if (expanded) elem.style.height = 'auto';});
            elem.classList.add('expanded');
        }
        expanded = !expanded;
    });
});

// nav toggle
const navBurger =  document.querySelector('header .nav .nav-burger'),
      navLinks = document.querySelector('header .nav .nav-links');
navBurger.addEventListener('click', (event) => {
    event.preventDefault();
    navLinks.classList.toggle('nav-dropdown-show');
});
