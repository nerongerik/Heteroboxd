import { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, useWindowDimensions } from "react-native";
import {Colors} from '../constants/colors';
import * as format from '../helpers/format';

const buckets = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

const Histogram = ({ histogram }) => {
  const [activeOutput, setActiveOutput] = useState(null);
  const totalRatings = Object.values(histogram).reduce((sum, count) => sum + count, 0);
  const averageRating = Object.entries(histogram).reduce((sum, [rating, count]) => sum + (rating * count), 0) / totalRatings;

  const counts = buckets.map(r => histogram[r] ?? 0);
  const maxCount = Math.max(...counts);
  const volumeScale = Math.log10(totalRatings + 10);

  const data = buckets.map(rating => {
    const count = histogram[rating] ?? 0;
    const relative = maxCount === 0 ? 0 : count / maxCount;
    const normalizedHeight = relative * volumeScale;
    return {
      rating,
      count,
      height: format.round2(normalizedHeight)
    };
  });

  const {width} = useWindowDimensions();
  const widescreen = useMemo(() => width > 1000, [width]);

  const MIN_HEIGHT = widescreen ? 5 : 3;
  const MAX_HEIGHT = widescreen ? 90 : 70;
  const BAR_WIDTH = widescreen ? 750/12.5 : width/15;

  useEffect(() => {
    if (averageRating) {
      setActiveOutput(format.round1(averageRating));
    }
  }, [averageRating]);

  return (
    <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: widescreen ? 750 : '90%', alignSelf: 'center'}}>
      <View style={{flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginRight: 5}}>
        {data.map(({ rating, count, height }) => (
            <TouchableOpacity key={rating} onPressIn={() => setActiveOutput(format.formatCount(count))} onPressOut={() => setActiveOutput(format.round1(averageRating))}>
              <View
                style={{
                  backgroundColor: Colors.text,
                  marginRight: widescreen ? 3 : 1,
                  height: Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, height * MAX_HEIGHT)),
                  width: BAR_WIDTH,
                  borderTopLeftRadius: widescreen ? 4 : 3,
                  borderTopRightRadius: widescreen ? 4 : 3
                }}
              />
            </TouchableOpacity>
        ))}
      </View>
      <Text style={{color: Colors.text_title, fontSize: widescreen ? 28 : 20, fontWeight: '600'}}>{activeOutput}</Text>
    </View>
  );
};

export default Histogram;