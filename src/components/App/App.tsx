import React, {
    useEffect,
    useState
} from 'react';

import axios from 'axios';

import MapView from '../MapView/MapView';
import Covid19TrendLayer from '../Covid19TrendLayer/Covid19TrendLayer';
import QueryTaskLayer from '../QueryTaskLayer/QueryTaskLayer';
import ControlPanel from '../ControlPanel/ControlPanel';

import {
    TrendData,
    Covid19USCountyTrendData,
    Covid19USStateTrendData
} from 'covid19-trend-map'

import AppConfig from '../../AppConfig';

import {
    urlFns
} from 'helper-toolkit-ts';

const UrlSearchParams = urlFns.parseQuery();
// console.log(UrlSearchParams.trend)

const DefaultTrend:TrendData = UrlSearchParams.trend;

const App = () => {

    const [ activeTrendData, setActiveTrendData ] = useState<TrendData>(DefaultTrend || 'new-cases');

    // const [ showNormalizedData, setShowNormalizedData ] = useState<boolean>(true);

    const [ covid19USCountiesData, setCovid19USCountiesData ] = useState<Covid19USCountyTrendData[]>();

    const [ covid19USStatesData, setCovid19USStatesData ] = useState<Covid19USStateTrendData[]>();

    const fetchData = async()=>{

        try {
            const queryResUSCounties = await axios.get<Covid19USCountyTrendData[]>(AppConfig["covid19-data-us-counties-url"]);
            setCovid19USCountiesData(queryResUSCounties.data);
            // console.log(queryResUSCounties)

            const queryResUSStates = await axios.get<Covid19USStateTrendData[]>(AppConfig["covid19-data-us-states-url"]);
            setCovid19USStatesData(queryResUSStates.data);
            // console.log(queryResUSStates)

        } catch(err){
            console.error(err);
        }

    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <>
            <MapView 
                webmapId={AppConfig["webmap-id"]}
            >
                {/* <Covid19TrendLayer 
                    key='US-Counties'
                    data={covid19USCountiesData}
                    activeTrendData={activeTrendData}
                    size={18}
                    visibleScale={AppConfig["us-counties-layer-visible-scale"]}
                /> */}

                <Covid19TrendLayer 
                    key='US-States'
                    data={covid19USStatesData}
                    activeTrendData={activeTrendData}
                    size={24}
                    visibleScale={AppConfig["us-states-layer-visible-scale"]}
                />

                <QueryTaskLayer 
                    key='query-4-US-Counties'
                    itemId='7566e0221e5646f99ea249a197116605'
                    outFields={['FIPS']}
                    visibleScale={AppConfig["us-counties-layer-visible-scale"]}
                    onSelect={(countyFeature)=>{
                        console.log(countyFeature);
                    }}
                />

                <QueryTaskLayer 
                    key='query-4-US-States'
                    itemId='99fd67933e754a1181cc755146be21ca'
                    outFields={['STATE_NAME']}
                    visibleScale={AppConfig["us-states-layer-visible-scale"]}
                    onSelect={(stateFeature)=>{
                        console.log(stateFeature);
                    }}
                />
            </MapView>

            <ControlPanel 
                activeTrendData={activeTrendData}
                trendDataOnChange={setActiveTrendData}
            />
        </>
    )
}

export default App
