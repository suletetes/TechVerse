import React, { memo, useMemo, useCallback } from 'react';
import { useVirtualScroll } from '../../hooks/usePerformance.js';

const VirtualList = memo(({
  items,
  itemHeight = 50,
  containerHeight = 400,
  renderItem,
  className = '',
  overscan = 5,
  ...props
}) => {
  const { visibleItems, handleScroll } = useVirtualScroll(
    items,
    itemHeight,
    containerHeight
  );

  const containerStyle = useMemo(() => ({
    height: containerHeight,
    overflow: 'auto',
    position: 'relative'
  }), [containerHeight]);

  const contentStyle = useMemo(() => ({
    height: visibleItems.totalHeight,
    position: 'relative'
  }), [visibleItems.totalHeight]);

  const visibleContentStyle = useMemo(() => ({
    transform: `translateY(${visibleItems.offsetY}px)`,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0
  }), [visibleItems.offsetY]);

  const renderVisibleItems = useCallback(() => {
    return visibleItems.items.map((item, index) => {
      const actualIndex = visibleItems.startIndex + index;
      return (
        <div
          key={item.id || actualIndex}
          style={{ height: itemHeight }}
          data-index={actualIndex}
        >
          {renderItem(item, actualIndex)}
        </div>
      );
    });
  }, [visibleItems, itemHeight, renderItem]);

  return (
    <div
      className={`virtual-list ${className}`}
      style={containerStyle}
      onScroll={handleScroll}
      {...props}
    >
      <div style={contentStyle}>
        <div style={visibleContentStyle}>
          {renderVisibleItems()}
        </div>
      </div>
    </div>
  );
});

VirtualList.displayName = 'VirtualList';

export default VirtualList;