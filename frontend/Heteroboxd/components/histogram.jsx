import { useEffect, useMemo, useState } from 'react'
import { TouchableOpacity, useWindowDimensions, View } from 'react-native'
import * as format from '../helpers/format'
import { Colors } from '../constants/colors'
import HText from './htext'
import Stars from './stars'

const BUCKETS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]

const Histogram = ({ histogram }) => {

  const [ activeOutput, setActiveOutput ] = useState(null)
  const [ pressed, setPressed ] = useState(-1)
  const { width } = useWindowDimensions()

  const totalRatings = Object.values(histogram).reduce((sum, count) => sum + count, 0)
  const averageRating = Object.entries(histogram).reduce((sum, [rating, count]) => sum + (rating * count), 0) / totalRatings
  const counts = BUCKETS.map(r => histogram[r] ?? 0)
  const maxCount = Math.max(...counts)
  const data = BUCKETS.map(rating => {
    const count = histogram[rating] ?? 0
    const normalizedHeight = maxCount === 0 ? 0 : count / maxCount
    return { rating, count, height: format.round2(normalizedHeight) }
  })

  const widescreen = useMemo(() => width > 1000, [width]);

  const MIN_HEIGHT = widescreen ? 5 : 3
  const MAX_HEIGHT = widescreen ? 90 : 70
  const BAR_WIDTH = widescreen ? 750/12.5 : width/15

  useEffect(() => {
    if (averageRating != null && !isNaN(averageRating)) {
      setActiveOutput(format.round1(averageRating))
    }
  }, [averageRating])

  return (
    <View style={{width: widescreen ? 750 : '90%', alignSelf: 'center'}}>
      <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', alignSelf: 'center'}}>
        <View style={{flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginRight: 5}}>
          {data.map(({ rating, count, height }) => (
              <TouchableOpacity key={rating} onPressIn={() => {setActiveOutput(format.formatCount(count)); setPressed(rating)}} onPressOut={() => {setActiveOutput(format.round1(averageRating)); setPressed(-1)}}>
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
        <HText style={{color: Colors.text_title, fontSize: widescreen ? 28 : 20, fontWeight: '600'}}>{activeOutput}</HText>
      </View>
      { pressed >= 0 ? (
        <View style={{width: '100%', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', height: widescreen ? 40 : 30}}>
          <Stars size={widescreen ? 30 : 20} rating={pressed} readonly padding={false} align={'center'} />
        </View>
      ) : (
        <View style={{width: '100%', alignSelf: 'center', alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', height: widescreen ? 40 : 30}}>
          <Stars size={widescreen ? 30 : 20} rating={0} readonly padding={false} align={'flex-start'} />
          <Stars size={widescreen ? 30 : 20} rating={5} readonly padding={false} align={'flex-end'} />
        </View>
      )}
    </View>
  )
}

export default Histogram
