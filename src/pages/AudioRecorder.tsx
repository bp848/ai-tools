
import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { AudioRecorderControls } from '@/components/AudioRecorderControls';
import { TranscriptionProgress } from '@/components/TranscriptionProgress';
import { TranscriptionResult } from '@/components/TranscriptionResult';
import { AudioExportButton } from '@/components/AudioExportButton';
import { handleTranscription } from '@/utils/handleTranscription';

export default function AudioRecorder() {
  const [transcription, setTranscription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  
  const { toast } = useToast();
  
  const API_KEY = 'AIzaSyB3e3yEOKECnlDtivhi_jPxOpepk8wo6jE';

  const { 
    isRecording, 
    audioBlob, 
    recordingTime, 
    amplitude, 
    audioStream, 
    startRecording, 
    stopRecording,
    setAudioBlob
  } = useAudioRecorder();

  const onTranscriptionComplete = async (blob: Blob) => {
    if (!blob || blob.size === 0) {
      toast({
        title: "エラー",
        description: "音声データが空です。録音を再試行してください。",
        variant: "destructive"
      });
      return;
    }
    
    console.log("文字起こし処理開始:", blob.type, blob.size, "bytes");
    setIsProcessing(true);
    setTranscription(''); // クリア
    
    try {
      await handleTranscription(blob, {
        apiKey: API_KEY,
        onProgress: setTranscriptionProgress,
        onTranscriptionChange: (text) => {
          console.log("文字起こし結果更新:", text);
          setTranscription(text);
        },
        onProcessingStateChange: setIsProcessing,
        onTranscribingStateChange: setIsTranscribing
      });
    } catch (error) {
      console.error("文字起こしエラー:", error);
      toast({
        title: "文字起こしエラー",
        description: error instanceof Error ? error.message : "文字起こし中にエラーが発生しました",
        variant: "destructive"
      });
      setIsProcessing(false);
      setIsTranscribing(false);
    }
  };

  const handleStopRecording = async () => {
    stopRecording();
    
    // stopRecordingはブロブが後から設定されるため、少し待ってからチェック
    setTimeout(() => {
      if (audioBlob) {
        console.log("録音停止後のブロブ:", audioBlob.type, audioBlob.size, "bytes");
        onTranscriptionComplete(audioBlob);
      } else {
        console.error("録音ブロブが取得できませんでした");
        toast({
          title: "録音エラー",
          description: "録音データが取得できませんでした。もう一度お試しください。",
          variant: "destructive"
        });
      }
    }, 500); // 少し待ってからブロブをチェック
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>音声文字起こし</CardTitle>
          <CardDescription>
            音声を録音してリアルタイムで文字起こしを行います。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AudioRecorderControls 
            isRecording={isRecording}
            recordingTime={recordingTime}
            amplitude={amplitude}
            audioStream={audioStream}
            isProcessing={isProcessing}
            isTranscribing={isTranscribing}
            onStartRecording={startRecording}
            onStopRecording={handleStopRecording}
            onFileInputClick={() => {}} // 使用しない機能
          />

          <TranscriptionProgress 
            isProcessing={isProcessing}
            isTranscribing={isTranscribing}
            uploadProgress={0} // ファイルアップロードは使用しない
            transcriptionProgress={transcriptionProgress}
          />

          {audioBlob && !isRecording && (
            <AudioExportButton 
              audioBlob={audioBlob}
              isDisabled={isProcessing || isTranscribing}
            />
          )}

          <TranscriptionResult 
            transcription={transcription}
            isTranscribing={isTranscribing}
          />
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-xs text-muted-foreground">
            Gemini Genius Lab - 音声文字起こしツール v{APP_VERSION}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export const APP_VERSION = "1.3.0"; // 2025-03-05 リリース - 録音機能のみに特化

