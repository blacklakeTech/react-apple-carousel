import React from 'react';
import Measure from 'react-measure';
import PropTypes from 'prop-types';
import { presets, Motion, spring } from 'react-motion';
import styled from 'styled-components';
import { getPosition, getCurrentMillis } from './helpers';
import { calculateNextDistance } from './math';
import { stringifyTranslate, calculateSlidingAnimation } from './animation';

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`;

const Slides = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  overflow-x: hidden;
  overflow-y: hidden;
`;

const Slide = styled.div`
  width: 100%;
  color: ${(props) => props.color};
  background: ${(props) => props.bgColor};
  flex-shrink: 0;
  ${(props) => stringifyTranslate(calculateSlidingAnimation(props))}
`;

const IndicatorsWrapper = styled.div`
  position: absolute;
  width: 100%;
  bottom: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const IndicatorsInnerWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  max-width: ${150 + 10 + 10}px;
`;

const IndicatorWrapper = styled.div`
  padding: 10px 0px;
  flex-grow: 1;
`;

const Indicator = styled.div`
  height: 2px;
  background: rgba(128,128,128,0.2);
  margin: 0px 5px;
`;

const InnerIndicator = styled.div`
  height: 2px;
  width: 0%;
  ${(props) => props.isActive && `width: 100%`}
  background: gray;
`;

export default class AppleCarousel extends React.Component {
  static propTypes = {
    // Array of functions that return a react element
    renderSlides: PropTypes.arrayOf(PropTypes.func).isRequired,
    springConfig: PropTypes.shape({
      stiffness: PropTypes.number,
      damping: PropTypes.number,
    }),
    breakPointRatio: PropTypes.number,
    activeItemIndex: PropTypes.number,
    parallaxValue: PropTypes.number,
  };

  static defaultProps = {
    springConfig: presets.noWobble,
    breakPointRatio: 0.5,
    activeItemIndex: 0,
    parallaxValue: -10,
  };

  componentWillMount() {
    const { activeItemIndex } = this.props;

    this.setState({
      activeItemIndex: activeItemIndex,
      animateTo: activeItemIndex,
      containerWidth: 0,
    });
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.activeItemIndex !== this.state.activeItemIndex) {
      this.animateTo(nextState.activeItemIndex);
    }
  }

  animateTo(animateTo) {
    this.setState({ animateTo });
  }

  onIndicatorClick = (index) => {
    this.setState({
      activeItemIndex: index,
    });
  }

  swipeEnd = ({
    startPosX,
    breakPointRatio,
    activeItemIndex,
    noOfSlides,
    containerWidth,
    lastPosX,
    startDragMillis,
  }) => {
    if(!startPosX || !lastPosX) {
      return;
    }

    const deltaX = lastPosX - startPosX;
    const swippingLeft = deltaX < 0;
    const endDragMillis = getCurrentMillis();
    const resistanceCoeffiecent = 0.5;

    const nextDistance = calculateNextDistance({
      deltaX,
      startDragMillis,
      endDragMillis,
      resistanceCoeffiecent,
    });

    const nextPosX = nextDistance + lastPosX;
    const nextPosRatio = nextPosX / containerWidth;

    if(swippingLeft) {
      if(activeItemIndex < noOfSlides - 1 && nextPosRatio < breakPointRatio) {
        this.setState({
          activeItemIndex: activeItemIndex + 1,
        });
      } else {
        this.animateTo(activeItemIndex);
      }
    } else {
      if(activeItemIndex > 0 && nextPosRatio > breakPointRatio) {
        this.setState({
          activeItemIndex: activeItemIndex - 1,
        });
      } else {
        this.animateTo(activeItemIndex);
      }
    }
  }

  swipeMove = (e, {
    startPosX,
    activeItemIndex,
    containerWidth,
    noOfSlides,
  }) => {
    const { posX, posY } = getPosition(e);
    const posXRelativeToContainer = ((startPosX - posX) / containerWidth);
    const animateTo = activeItemIndex + posXRelativeToContainer;
    if(animateTo > 0 && animateTo < noOfSlides) {
      this.setState({
        lastPosX: posX,
        animateTo,
      });
    }
  }

  swipeStart = (e) => {
    const { posX } = getPosition(e);
    this.setState({
      startPosX: posX,
      startDragMillis: getCurrentMillis(),
    });
  }

  isIndicatorActive = ({
    index,
    activeItemIndex,
    slide,
    breakPointRatio,
  }) => {
    return (index - breakPointRatio) <= slide && (index + breakPointRatio) >= slide;
  }

  render() {
    const {
      springConfig,
      breakPointRatio,
      parallaxValue,
      renderSlides,
    } = this.props;

    const {
      animateTo,
      activeItemIndex,
      containerWidth,
      startDragMillis,
      startPosX,
      lastPosX,
    } = this.state;

    const noOfSlides = renderSlides.length;

    return (
      <Measure
        whitelist={['width']}
        onMeasure={({ width }) => {
          this.setState({
            containerWidth: width,
          });
        }}
      >
        <Motion
          defaultStyle={{
            slide: 0,
          }}
          style={{
            slide: spring(animateTo, springConfig),
          }}
        >
        {({ slide }) => (
          <Wrapper
            onTouchEnd={() => this.swipeEnd({
              startPosX,
              breakPointRatio,
              activeItemIndex,
              noOfSlides,
              containerWidth,
              lastPosX,
              startDragMillis,
            })}
            onTouchMove={(e) => this.swipeMove(e, {
              startPosX,
              activeItemIndex,
              containerWidth,
              noOfSlides,
            })}
            onTouchStart={(e) => this.swipeStart(e)}
          >
            <Slides>
              {renderSlides.map((renderSlide, index) => (
                <Slide
                  key={index}
                  index={index}
                  activeItemIndex={activeItemIndex}
                  slide={slide}
                  containerWidth={containerWidth}
                >
                {renderSlide({
                  index,
                  slide,
                  activeItemIndex,
                  containerWidth,
                })}
                </Slide>
              ))}
            </Slides>
            <IndicatorsWrapper>
              <IndicatorsInnerWrapper>
                {renderSlides.map((renderSlide, index) => (
                  <IndicatorWrapper
                    onClick={() => this.onIndicatorClick(index)}
                    key={index}
                  >
                    <Indicator>
                      <InnerIndicator
                        isActive={this.isIndicatorActive({
                          index,
                          activeItemIndex,
                          slide,
                          breakPointRatio,
                        })}
                      />
                    </Indicator>
                  </IndicatorWrapper>
                ))}
              </IndicatorsInnerWrapper>
            </IndicatorsWrapper>
          </Wrapper>
        )}
        </Motion>
      </Measure>
    );
  }
}
