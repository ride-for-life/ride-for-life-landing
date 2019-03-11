class Carousel {
  constructor(carouselContainer) {
    this.container = carouselContainer;
    this.element = this.container.querySelector('.carousel');
    this.images = this.element.querySelectorAll('img');
    this.container.style.width = 100 * this.images.length + '%';
    this.imageContainers = this.element.querySelectorAll('.carousel-img-container');
    this.imageContainers.forEach(i => i.style.width = 100 / this.images.length + '%');
    // this.imageContainers.forEach((i, idx) => i.style.zIndex = idx);
    // this.imageContainers.forEach(i => i.style.minWidth = 100 / this.images.length + '%');
    // this.images.forEach(i => i.style.width = 100 / this.images.length + '%');
    this.offset = this.minOffset();
    this.touchOrigin = 0;
    this.velocity = 0;

    this.initButtons();
    // TODO Unify mouse and touch? See tutsplus?
    // TODO Decide when buttons appear

    this.resizeLock = false;
    window.addEventListener('resize', () => {
      if (!this.resizeLock) {
        this.resizeLock = true;
        this.element.classList.remove('carousel-snap');
        setTimeout(() => {
          this.setOffset(Math.round(this.offset / this.imageWidth()) * this.imageWidth());
          this.scrollToOffset();
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
    // return this.images[this.images.length - 1].x - this.images[0].x;
    // return this.imageContainers[this.imageContainers.length - 1].x - this.imageContainers[0].x;
  }
  minOffset() {
    return 0;
  }
  setOffset(offset) {
    offset = Math.max(offset, this.minOffset());
    offset = Math.min(offset, this.maxOffset());
    this.offset = offset;
  }
  closestIndex() {
    return Math.round(this.offset / this.imageWidth());
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
    this.next = document.createElement('span');
    this.next.classList.add('carousel-next');
    this.next.textContent = '❯';
    this.next.style.right = 100 - (100 / this.images.length) + '%';
    this.next.addEventListener('click', () => this.scrollNext());
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
      this.setOffset(this.imageWidth() * (closestIndex + (this.touchOrigin - this.lastLoc > 0 ? 1 : -1)));
    } else if (Math.abs(this.velocity) > 20 && Math.sign(this.velocity) * Math.sign(distance) >= 0) {
      // sign check makes sure we don't jump over an image on an aggressive scroll
      this.setOffset(this.imageWidth() * (closestIndex + (this.velocity > 0 ? 1 : -1)));
    }
    else {
      this.setOffset(this.imageWidth() * closestIndex);
    }
    this.scrollToOffset();
    this.updateIndicator();
  }

  scrollToOffset() {
    this.element.style.transform = 'translateX(' + -this.offset + 'px)';
  }

  scrollToIndex(index) {
    this.setOffset(this.imageWidth() * index);
    this.scrollToOffset();
  }

  scrollBy(delta) {
    this.setOffset(this.offset + delta);
    this.scrollToOffset();
  }

  startTouchScroll(event) {
    this.element.classList.remove('carousel-snap');
    this.touchOrigin = event.touches[0].pageX;
    this.lastLoc = this.touchOrigin;
    const stopTouchScroll = ((event) => {
      this.element.removeEventListener('touchend', stopTouchScroll);
      this.element.removeEventListener('touchmove', touchMove);
      this.snapToImage();
    });
    const touchMove = ((event) => {
      // prevent back/forward on mobile swipe
      event.preventDefault();
      const touchLoc = event.changedTouches[0].pageX;
      this.velocity = this.lastLoc - touchLoc;
      this.scrollBy(this.velocity);
      this.lastLoc = touchLoc;
    });
    this.element.addEventListener('touchend', stopTouchScroll);
    this.element.addEventListener('touchmove', touchMove);
  }
}

const carousels = document.querySelectorAll('.carousel-container');
carousels.forEach(carousel => new Carousel(carousel));
