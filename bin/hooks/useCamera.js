import { Log } from "lib/utils";
import { useEffect } from "react";
const log = Log(`useCamera`);
export function useCamera(video, device) {
    useEffect(() => {
        if (video && device) {
            startPlay(video, device);
            return () => stopPlay(video);
        }
    }, [video, device]);
}
async function startPlay(video, device) {
    try {
        log(`starting video from '${device.label}'`);
        const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: device.deviceId } }, audio: false });
        video.srcObject = stream;
        await video.play();
    }
    catch (err) {
        log.error(`startPlay: An error occurred: ${err}`);
    }
}
function stopPlay(video) {
    log(`stopPlay...`);
    if (video.srcObject) {
        const tracks = video.srcObject.getVideoTracks();
        log(`stopping ${tracks.length} tracks`);
        tracks.forEach(track => track.stop());
        video.srcObject = null;
    }
}
export async function showAvailableDevices() {
    try {
        await navigator.mediaDevices.enumerateDevices();
        await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const videoDevs = (await navigator.mediaDevices.enumerateDevices()).filter(device => device.kind === 'videoinput');
        videoDevs.forEach((device, i) => {
            if (device.kind === 'videoinput') {
                //log(`${device.kind}: ${device.label} id = ${device.deviceId}`, device)
                log(`device ${i}: '${device.label}'`);
            }
        });
        return videoDevs;
    }
    catch (err) {
        log.error(`showAvailableDevices: ${err}`);
    }
    return [];
}
