#include "mainwindow.h"
#include "ui_mainwindow.h"

MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
{
    ui->setupUi(this);
    qApp->applicationDirPath() ;
    mpWebView = new QWebEngineView;
    mpWebView->page()->load(QUrl("qrc:/dist/index.html"));
    mpWebView->show();
    ui->verticalLayout->addWidget(mpWebView);
}

MainWindow::~MainWindow()
{
    mpWebView->close();
    delete ui;
}
double MainWindow::fromDToR(double alfa)//��ॢ�� �� �ࠤ�ᮢ � ࠤ����
{
    return Pi / 180 * alfa;
}

void MainWindow::on_pushButton_clicked()
{
    QGeoCoordinate LaLo;

    LaLo.setLatitude(ui->lineEdit->text().toDouble());
    LaLo.setLongitude(ui->lineEdit_2->text().toDouble());
    Coord.push_back(LaLo);
    size_t size = Coord.size();
    qDebug() << "Latitude[" << size <<"]: " <<LaLo.latitude() << "Longitude[" << size << "]: " << LaLo.longitude();
}


void MainWindow::on_pushButton_2_clicked()
{
    size_t size = Coord.size();
    if(size > 1)
        Coord.clear();
}


void MainWindow::on_pushButton_3_clicked()
{
    size_t size = Coord.size();
    if(size > 1)
    {
        double fin = Coord[size-2].longitude(),fik = Coord[size-1].longitude(), lambdan = Coord[size-2].latitude(), lambdak = Coord[size-1].latitude();
        double X1,Y1,Z1,X2,Y2,Z2;
        //��ॢ�� �� �������᪨� ���न��� � ���業������ ��
        X1 = Radius * sin(fromDToR(lambdan)) * cos(fromDToR(fin));
        Y1 = Radius * cos(fromDToR(lambdan)) * cos(fromDToR(fin));
        Z1 = Radius * sin(fromDToR(fin));
        X2 = Radius * sin(fromDToR(lambdak)) * cos(fromDToR(fik));
        Y2 = Radius * cos(fromDToR(lambdak)) * cos(fromDToR(fik));
        Z2 = Radius * sin(fromDToR(fik));
        //alfa - 㣮� ����� 2 �窠�� �� ���-�� ����� � 業�஬ ����� � �ࠤ���, l - ����� ��אַ� �஢������� �/� ���� �窠��
        double alfa, l = sqrt( pow(X1 - X2,2) + pow(Y1 - Y2,2) + pow(Z1 - Z2,2) );
        alfa = acos((pow(Radius,2)*2 - pow(l,2))/(2*pow(Radius,2)))*57.3;
        //����� ��⮤஬��
        double orto = Pi*Radius/180 * alfa;
        int N = 10;
        double ctgpsi0, f1 = fin , l1 = lambdan;
        // mpWebView->page()->runJavaScript(QString("%1,%2").arg(f1).arg(l1));
        for(size_t i = 1; i <= N; i++)
        {
            ctgpsi0 = cos(fromDToR(f1))*tan(fromDToR(fik))/sin(fromDToR(lambdak - l1)) - sin(fromDToR(f1))/tan(fromDToR(lambdak-l1));
            ctgpsi0 = atan(ctgpsi0);
            qDebug() << "psi=" << ctgpsi0*57.3;
            qDebug() << "cos=" << cos(ctgpsi0) << " sin=" << sin(ctgpsi0);
            qDebug() <<  f1 + 57.3*orto/N*sin(ctgpsi0)/(Radius) << " " << l1 + 57.3*orto/N*cos(ctgpsi0)/(Radius*cos(fromDToR(f1)));
            f1 += 57.3*orto/N * sin(ctgpsi0)/(Radius);
            l1 += 57.3*orto/N * cos(ctgpsi0)/(Radius*cos(fromDToR(f1)));
            // mpWebView->page()->runJavaScript(QString("%1,%2").arg(f1).arg(l1));
        }

    }
}
