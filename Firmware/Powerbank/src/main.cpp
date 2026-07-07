#include "debug.h"

/* I2C Slave Address */
#define SLAVE_ADDRESS 0x77

uint32_t uid1 = 0;
uint32_t uid2 = 0;
uint8_t TxData[10]; // buffer for 64-bit UID

uint32_t GetMCUUID1(void)
{
    return (*(uint32_t *)0x1FFFF7E8);
}

uint32_t GetMCUUID2(void)
{
    return (*(uint32_t *)0x1FFFF7EC);
}

void InitializeADC()
{
     ADC_InitTypeDef ADC_InitStructure = {0};
     GPIO_InitTypeDef GPIO_InitStructure = {0};

     RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOA, ENABLE);
     RCC_APB2PeriphClockCmd(RCC_APB2Periph_ADC1, ENABLE);
     RCC_ADCCLKConfig(RCC_PCLK2_Div8);

     GPIO_InitStructure.GPIO_Pin = GPIO_Pin_1;
     GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AIN;
     GPIO_Init(GPIOC, &GPIO_InitStructure); 

     ADC_DeInit(ADC1);
     ADC_InitStructure.ADC_Mode = ADC_Mode_Independent;
     ADC_InitStructure.ADC_ScanConvMode = DISABLE;
     ADC_InitStructure.ADC_ContinuousConvMode = ENABLE; 
     ADC_InitStructure.ADC_ExternalTrigConv = ADC_ExternalTrigConv_None; 
     ADC_InitStructure.ADC_DataAlign = ADC_DataAlign_Right;
     ADC_InitStructure.ADC_NbrOfChannel = 1; 
     ADC_Init(ADC1, &ADC_InitStructure);

     ADC_RegularChannelConfig(ADC1, ADC_Channel_1, 1, ADC_SampleTime_241Cycles);


     ADC_Cmd(ADC1, ENABLE);
     ADC_ResetCalibration(ADC1);
     while(ADC_GetResetCalibrationStatus(ADC1));
     ADC_StartCalibration(ADC1);
     while(ADC_GetCalibrationStatus(ADC1));

     ADC_SoftwareStartConvCmd(ADC1, ENABLE);
}

void IIC_Init_Slave(uint32_t bound, uint16_t address)
{
    GPIO_InitTypeDef GPIO_InitStructure = {0};
    I2C_InitTypeDef I2C_InitStructure = {0};

    RCC_APB2PeriphClockCmd(RCC_APB2Periph_GPIOC | RCC_APB2Periph_AFIO, ENABLE);
    RCC_APB1PeriphClockCmd(RCC_APB1Periph_I2C1, ENABLE);

    /* Configure I2C pins */
    GPIO_InitStructure.GPIO_Pin = GPIO_Pin_2 | GPIO_Pin_1; // SCL + SDA
    GPIO_InitStructure.GPIO_Mode = GPIO_Mode_AF_OD;
    GPIO_InitStructure.GPIO_Speed = GPIO_Speed_50MHz;
    GPIO_Init(GPIOC, &GPIO_InitStructure);

    /* I2C configuration */
    I2C_InitStructure.I2C_ClockSpeed = bound;
    I2C_InitStructure.I2C_Mode = I2C_Mode_I2C;
    I2C_InitStructure.I2C_DutyCycle = I2C_DutyCycle_16_9;
    I2C_InitStructure.I2C_OwnAddress1 = (address << 1);
    I2C_InitStructure.I2C_Ack = I2C_Ack_Enable;
    I2C_InitStructure.I2C_AcknowledgedAddress = I2C_AcknowledgedAddress_7bit;
    I2C_Init(I2C1, &I2C_InitStructure);

    I2C_Cmd(I2C1, ENABLE);
    I2C_AcknowledgeConfig(I2C1, ENABLE);
}

int main(void)
{
    uint8_t i = 0;

    Delay_Init();
    USART_Printf_Init(460800);
    printf("SystemClk:%ld\r\n", SystemCoreClock);
    printf("I2C Slave mode\r\n");

    // Read UID
    uid1 = GetMCUUID1();
    uid2 = GetMCUUID2();

    InitializeADC();

    // Fill TxData buffer with UID bytes (little endian)
    TxData[0] = uid1 & 0xFF;
    TxData[1] = (uid1 >> 8) & 0xFF;
    TxData[2] = (uid1 >> 16) & 0xFF;
    TxData[3] = (uid1 >> 24) & 0xFF;

    TxData[4] = uid2 & 0xFF;
    TxData[5] = (uid2 >> 8) & 0xFF;
    TxData[6] = (uid2 >> 16) & 0xFF;
    TxData[7] = (uid2 >> 24) & 0xFF;

    IIC_Init_Slave(80000, SLAVE_ADDRESS);

    while (1)
    {
        Delay_Ms(1);
        if (I2C_CheckEvent(I2C1, I2C_EVENT_SLAVE_TRANSMITTER_ADDRESS_MATCHED))
        {
            uint16_t adcValue = ADC_GetConversionValue(ADC1);
            TxData[8] = adcValue & 0xFF;
            TxData[9] = (adcValue >> 8) & 0xFF;

            i = 0;
            while (i < 10) // send 8 bytes (64-bit UID)
            {
                while (I2C_GetFlagStatus(I2C1, I2C_FLAG_TXE) == RESET);
                I2C_SendData(I2C1, TxData[i]);
                i++;
            }

            /* Wait until master stops communication */
            while (!I2C_CheckEvent(I2C1, I2C_EVENT_SLAVE_STOP_DETECTED));
            I2C_ClearFlag(I2C1, I2C_FLAG_STOPF);
        }
    }
}
