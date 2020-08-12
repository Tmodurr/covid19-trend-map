import React, {
    useEffect,
    useState
} from 'react';

import {
    useDispatch
} from 'react-redux';

import axios from 'axios';

import {
    tooltipDataChanged,
    tooltipPositionChanged,
    isStateLayerVisilbeToggled
} from '../../store/reducers/Map';

import {
    activeTrendUpdated,
    isAboutModalOpenToggled,
    showTrendCategoriesToggled
} from '../../store/reducers/UI';

import About from '../About/About';
import MapView from '../MapView/MapView';
import Tooltip, {
    TooltipData
} from '../Tooltip/Tooltip';
import ChartPanel from '../ChartPanel/ChartPanel';
import BottomPanel from '../BottomPanel/BottomPanel';
import ControlPanel from '../ControlPanel/ControlPanel';
import QueryTaskLayer from '../QueryTaskLayer/QueryTaskLayer';
import SummaryInfoPanel from '../SummaryInfoPanel/SummaryInfoPanel';
import Covid19TrendLayer from '../Covid19TrendLayer/Covid19TrendLayer';
import QueryTaskResultLayer from '../QueryTaskResultLayer/QueryTaskResultLayer'; 
import TrendCategoriesToggle from '../TrendCategoriesToggle/TrendCategoriesToggle';

import {
    Covid19TrendName,
    Covid19TrendData,
    Covid19LatestNumbers,
    Covid19CasesByTimeFeature,
    QueryLocation4Covid19TrendData
} from 'covid19-trend-map';

import IGraphic from 'esri/Graphic';

import AppConfig from '../../AppConfig';

import {
    urlFns, miscFns
} from 'helper-toolkit-ts';

import {
    fetchCovid19Data
} from '../../utils/queryCovid19Data';

import useMapCenterLocationFromUrl from '../../hooks/useMapLocationFromUrl';

const isMobile = miscFns.isMobileDevice();

// const UrlSearchParams = urlFns.parseQuery();
// const DefaultTrend:Covid19TrendName = UrlSearchParams.trend;

const App = () => {

    const dispatch = useDispatch();

    const [ covid19USCountiesData, setCovid19USCountiesData ] = useState<Covid19TrendData[]>();
    const [ covid19USStatesData, setCovid19USStatesData ] = useState<Covid19TrendData[]>();
    const [ covid19LatestNumbers, setCovid19LatestNumbers ] = useState<Covid19LatestNumbers>();

    const { locationFromURL, saveLocationInURL } = useMapCenterLocationFromUrl();

    const [ covid19CasesByTimeQueryResults, setCovid19CasesByTimeQueryResults ] = useState<Covid19CasesByTimeFeature[]>();
    // user can click map to select US State or County that will be used to query covid19 trend data
    const [ covid19CasesByTimeQueryLocation, setcovid19CasesByTimeQueryLocation ] = useState<QueryLocation4Covid19TrendData>();
    const [ isLoading, setIsLoading ] = useState<boolean>(false);

    const fetchData = async()=>{

        try {

            const HostUrl = AppConfig["static-files-host"];
            const Url4CountiesJSON = HostUrl + AppConfig["covid19-data-us-counties-json"];
            const Url4StatesJSON = HostUrl + AppConfig["covid19-data-us-states-json"];
            const Url4LatestNumbers = HostUrl + AppConfig["covid19-latest-numbers-json"];

            const queryResUSStates = await axios.get<Covid19TrendData[]>(Url4StatesJSON);
            setCovid19USStatesData(queryResUSStates.data);
            // console.log(queryResUSStates)

            const queryResUSCounties = await axios.get<Covid19TrendData[]>(Url4CountiesJSON);
            setCovid19USCountiesData(queryResUSCounties.data);
            // console.log(queryResUSCounties)

            const latestNumbers = await axios.get<Covid19LatestNumbers>(Url4LatestNumbers);
            setCovid19LatestNumbers(latestNumbers.data)

        } catch(err){
            console.error(err);
        }

    };

    const countyOnSelect = async(countyFeature:IGraphic)=>{

        if(!countyFeature){
            resetQueryResults();
            return false;
        }

        setcovid19CasesByTimeQueryLocation({
            graphic: countyFeature,
            locationName:  `${countyFeature.attributes['NAME']} CO, ${countyFeature.attributes['STATE_NAME']}`
        });

        const data = await fetchCovid19Data({
            countyFIPS: countyFeature.attributes['FIPS']
        });
        setCovid19CasesByTimeQueryResults(data);
    };

    const stateOnSelect = async(stateFeature:IGraphic)=>{

        if(!stateFeature){
            resetQueryResults();
            return false;
        }

        const stateName = stateFeature.attributes['STATE_NAME'];

        setcovid19CasesByTimeQueryLocation({
            graphic: stateFeature,
            locationName: stateFeature.attributes['STATE_NAME']
        });

        const data = await fetchCovid19Data({
            stateName
        });
        setCovid19CasesByTimeQueryResults(data);
    };

    const queryOnStartHandler = ()=>{
        setCovid19CasesByTimeQueryResults(undefined);
        setIsLoading(true);
    }

    const resetQueryResults = ()=>{
        setIsLoading(false);
        setCovid19CasesByTimeQueryResults(undefined);
        setcovid19CasesByTimeQueryLocation(undefined);
    };

    // when pointer hove US Counties or State Polygons
    const featureOnHoverHandler = (locationName:string, FIPS:string)=>{

        let tooltipData:TooltipData;

        if(locationName && FIPS){

            const latestNumbers4SelectedFeature = covid19LatestNumbers[FIPS];

            tooltipData = {
                locationName,
                confirmed: latestNumbers4SelectedFeature.Confirmed,
                deaths: latestNumbers4SelectedFeature.Deaths,
                weeklyNewCases: latestNumbers4SelectedFeature.NewCases
            };
        }

        // setTooltipData(tooltipData);

        dispatch(tooltipDataChanged(tooltipData))
    };

    useEffect(() => {
        console.log('App is updating')
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if(covid19CasesByTimeQueryResults){
            setIsLoading(false);
        }
    }, [covid19CasesByTimeQueryResults]);

    return (
        <>
            <MapView 
                webmapId={AppConfig["webmap-id"]}
                initialMapCenterLocation={locationFromURL}
                onStationary={saveLocationInURL}
            >
                <QueryTaskResultLayer 
                    queryResult={covid19CasesByTimeQueryLocation ? covid19CasesByTimeQueryLocation.graphic : undefined}
                />

                <Covid19TrendLayer 
                    key='US-Counties'
                    features={covid19USCountiesData}
                    size={20}
                    hasTrendCategoriesAttribute={true}
                    visibleScale={AppConfig["us-counties-layer-visible-scale"]}
                />

                <Covid19TrendLayer 
                    key='US-States'
                    features={covid19USStatesData}
                    size={24}
                    visibleScale={AppConfig["us-states-layer-visible-scale"]}
                    isLayerInVisibleScaleOnChange={(isVisible)=>{
                        // setIsStateLayerVisible(isVisible);
                        dispatch(isStateLayerVisilbeToggled(isVisible))

                        // hide tooltip to prevent showing the data from different layer which is no longer visible
                        // setTooltipData(undefined);
                        dispatch(tooltipDataChanged(undefined))
                    }}
                />

                <QueryTaskLayer 
                    key='query-4-US-Counties'
                    itemId={AppConfig["us-counties-feature-layer-item-id"]}
                    outFields={['FIPS', 'NAME', 'STATE_NAME']}
                    visibleScale={AppConfig["us-counties-layer-visible-scale"]}
                    onStart={queryOnStartHandler}
                    onSelect={countyOnSelect}
                    pointerOnMove={(position)=>{
                        dispatch(tooltipPositionChanged(position))
                    }}
                    featureOnHover={(feature)=>{

                        const locationName = feature 
                            ? `${feature.attributes['NAME']}, ${feature.attributes['STATE_NAME']}` 
                            : undefined;

                        const FIPS = feature 
                            ? feature.attributes['FIPS'] 
                            : undefined;

                        featureOnHoverHandler(locationName, FIPS);
                    }}
                />

                <QueryTaskLayer 
                    key='query-4-US-States'
                    itemId={AppConfig["us-states-feature-layer-item-id"]}
                    outFields={['STATE_NAME', 'STATE_FIPS']}
                    visibleScale={AppConfig["us-states-layer-visible-scale"]}
                    onStart={queryOnStartHandler}
                    onSelect={stateOnSelect}
                    pointerOnMove={(position)=>{
                        dispatch(tooltipPositionChanged(position))
                    }}
                    featureOnHover={(feature)=>{

                        const locationName = feature 
                            ? `${feature.attributes['STATE_NAME']}` 
                            : undefined;

                        const FIPS = feature 
                            ? feature.attributes['STATE_FIPS'] 
                            : undefined;

                        featureOnHoverHandler(locationName, FIPS);
                    }}
                />
            </MapView>

            <ControlPanel 
                isMobile={isMobile}
            />

            <TrendCategoriesToggle/>

            {
                covid19CasesByTimeQueryResults || isLoading ? (
                    <BottomPanel
                        showLoadingIndicator={isLoading}
                    >

                        <SummaryInfoPanel 
                            locationName={covid19CasesByTimeQueryLocation ? covid19CasesByTimeQueryLocation.locationName : undefined }
                            data={covid19CasesByTimeQueryResults}
                            isMobile={isMobile}
                            closeBtnOnClick={resetQueryResults}
                        />

                        <ChartPanel 
                            data={covid19CasesByTimeQueryResults}
                        />
                    </BottomPanel>
                ) : null
            }

            <Tooltip/>

            <About/>
        </>
    )
}

export default App
