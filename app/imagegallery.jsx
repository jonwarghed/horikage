'use strict';

var React = require('react/addons');
var ImageLoader = require('react-imageloader');

var ImageLoaderSpinner = React.createClass({
    getDefaultProps: function() {
        return {
            big: false
        }
    },
    css: function (){
      return 'fa fa-cog fa-spin' + (this.big ? ' big-spin' : ' small-spin');
    },
    render: function(){
        var css = this.css();
        return (<i className={css}></i>);
    }
});


var ImageGallery = React.createClass({

    mixins: [React.addons.PureRenderMixin],

    displayName: 'ImageGallery',

    propTypes: {
        items: React.PropTypes.array.isRequired,
        showThumbnails: React.PropTypes.bool,
        onSlide: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            showThumbnails: true
        }
    },

    getInitialState: function() {
        return {
            currentIndex: 0,
            thumbnailTranslateX: 0,
            containerWidth: 0
        };
    },

    componentDidUpdate: function(prevProps, prevState) {
        if (prevState.containerWidth != this.state.containerWidth ||
            prevProps.showThumbnails != this.props.showThumbnails) {
            // indexDifference should always be 1 unless its the initial index
            var indexDifference = this.state.currentIndex > 0 ? 1 : 0;

            // when the container resizes, thumbnailTranslateX
            // should always be negative (moving right),
            // if container fits all thumbnails its set to 0
            this.setState({
                thumbnailTranslateX: -this._getScrollX(indexDifference) * this.state.currentIndex
            });
        }

        if (prevState.currentIndex != this.state.currentIndex) {

            // call back function if provided
            if (this.props.onSlide) {
                this.props.onSlide(this.state.currentIndex);
            }

            // calculates thumbnail container position
            if (this.state.currentIndex === 0) {
                this.setState({thumbnailTranslateX: 0});
            } else {
                var indexDifference = Math.abs(prevState.currentIndex - this.state.currentIndex);
                var scrollX = this._getScrollX(indexDifference);
                if (scrollX > 0) {
                    if (prevState.currentIndex < this.state.currentIndex) {
                        this.setState({thumbnailTranslateX: this.state.thumbnailTranslateX - scrollX});
                    } else if (prevState.currentIndex > this.state.currentIndex) {
                        this.setState({thumbnailTranslateX: this.state.thumbnailTranslateX + scrollX});
                    }
                }
            }
        }

    },

    componentDidMount: function() {
        this.setState({containerWidth: this.getDOMNode().offsetWidth});
        if (this.props.autoPlay) {
            this.play();
        }
        window.addEventListener('resize', this._handleResize);
    },

    componentWillUnmount: function() {
        window.removeEventListener('resize', this._handleResize);
    },

    slideToIndex: function(index, event) {
        var slideCount = this.props.items.length - 1;

        if (index < 0) {
            this.setState({currentIndex: slideCount});
        } else if (index > slideCount) {
            this.setState({currentIndex: 0});
        } else {
            this.setState({currentIndex: index});
        }
        if (event) {
            if (this._intervalId) {
                // user event, reset interval
                this.pause();
                this.play();
            }
            event.preventDefault();
        }
    },

    play: function() {
        if (this._intervalId) return;
        this._intervalId = window.setInterval(function() {
            if (!this.state.hovering) {
                this.slideToIndex(this.state.currentIndex + 1);
            }
        }.bind(this), this.props.slideInterval);
    },

    pause: function() {
        if (this._intervalId) {
            window.clearInterval(this._intervalId);
            this._intervalId = null;
        }
    },

    _handleResize: function() {
        this.setState({containerWidth: this.getDOMNode().offsetWidth});
    },

    _getScrollX: function(indexDifference) {
        if (this.refs.thumbnails) {
            var thumbNode = this.refs.thumbnails.getDOMNode();
            if (thumbNode.scrollWidth <= this.state.containerWidth) {
                return 0;
            }
            var totalThumbnails = thumbNode.children.length;

            // total scroll-x required to see the last thumbnail
            var totalScrollX = thumbNode.scrollWidth - this.state.containerWidth;

            // scroll-x required per index change
            var perIndexScrollX = totalScrollX / (totalThumbnails - 1);

            return indexDifference * perIndexScrollX;
        }
    },

    _handleMouseOver: function() {
        this.setState({hovering: true});
    },

    _handleMouseLeave: function() {
        this.setState({hovering: false});
    },

    _getAlignment: function(index) {
        var currentIndex = this.state.currentIndex;
        var alignment = '';
        switch (index) {
            case (currentIndex - 1):
                alignment = 'left';
                break;
            case (currentIndex):
                alignment = 'center';
                if (this.props.items.length <= 3) {
                    alignment += ' relative';
                }
                break;
            case (currentIndex + 1):
                alignment = 'right';
                break;
        }

        if (this.props.items.length >= 3) {
            if (index === 0 && currentIndex === this.props.items.length - 1) {
                // set first slide as right slide if were sliding right from last slide
                alignment = 'right';
            } else if (index === this.props.items.length - 1 && currentIndex === 0) {
                // set last slide as left slide if were sliding left from first slide
                alignment = 'left';
            }
        }

        return alignment;
    },

    render: function() {
        var currentIndex = this.state.currentIndex;
        var ThumbnailStyle = {
            MozTransform: 'translate3d(' + this.state.thumbnailTranslateX + 'px, 0, 0)',
            WebkitTransform: 'translate3d(' + this.state.thumbnailTranslateX + 'px, 0, 0)',
            OTransform: 'translate3d(' + this.state.thumbnailTranslateX + 'px, 0, 0)',
            msTransform: 'translate3d(' + this.state.thumbnailTranslateX + 'px, 0, 0)',
            transform: 'translate3d(' + this.state.thumbnailTranslateX + 'px, 0, 0)'
        };

        var slides = [];
        var thumbnails = [];

        this.props.items.map(function(item, index) {
            var alignment = this._getAlignment(index);
            slides.push(
                <div
                    key={index}
                    className={'ImageGallery_content_slides_slide ' + alignment}>
                    <ImageLoader src={item.original} preloader={function() { return <ImageLoaderSpinner big={true}/>; }} className='large-photo fadeIn fadeIn-1s' >
                        Image load failed!
                    </ImageLoader>
                </div>
            );

            if (this.props.showThumbnails) {
                thumbnails.push(
                    <a
                        key={index}
                        className={'ImageGallery_thumbnail_container_thumbnails_thumbnail ' + (currentIndex === index ? 'active' : '')}
                        onTouchStart={this.slideToIndex.bind(this, index)}
                        onClick={this.slideToIndex.bind(this, index)}>
                        <ImageLoader src={item.thumbnail} className='thumbnail-photo' >
                            Image load failed!
                        </ImageLoader>

                    </a>
                );
            }

        }.bind(this));

        return (
            <section className='ImageGallery'>
                <div
                    onMouseOver={this._handleMouseOver}
                    onMouseLeave={this._handleMouseLeave}
                    className='ImageGallery_content'>

                    <a className='ImageGallery_content_left_nav'
                        onTouchStart={this.slideToIndex.bind(this, currentIndex - 1)}
                        onClick={this.slideToIndex.bind(this, currentIndex - 1)}/>


                    <a className='ImageGallery_content_right_nav'
                        onTouchStart={this.slideToIndex.bind(this, currentIndex + 1)}
                        onClick={this.slideToIndex.bind(this, currentIndex + 1)}/>

                    <div className='ImageGallery_content_slides'>
            {slides}
                    </div>

          {
          this.props.showBullets &&
          <div className='ImageGallery_bullet_container'>
              <ul className='ImageGallery_bullet_container_bullets'>
                  {bullets}
              </ul>
          </div>
              }
                </div>

        {
        this.props.showThumbnails &&
        <div className='ImageGallery_thumbnail_container'>
            <div
                ref='thumbnails'
                className='ImageGallery_thumbnail_container_thumbnails'
                style={ThumbnailStyle}>
                {thumbnails}
            </div>
        </div>
            }
            </section>
        );

    }

});

module.exports = ImageGallery;
