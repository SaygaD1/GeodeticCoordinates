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
double MainWindow::fromDToR(double alfa)//Перевод из градусов в радианы
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
    Coord.clear();
    Polygon.clear();
    mpWebView->page()->runJavaScript(QString("deleteMap()"));
}

void MainWindow::on_pushButton_3_clicked()
{
    size_t size = Coord.size();
    if(size > 1)
    {
        double fin = Coord[size-2].latitude(),fik = Coord[size-1].latitude(), lambdan = Coord[size-2].longitude(), lambdak = Coord[size-1].longitude();
        double X1,Y1,Z1,X2,Y2,Z2;
        //Перевод из географических координат в геоцентрическую СК
        X1 = Radius * cos(fromDToR(lambdan)) * cos(fromDToR(fin));
        Y1 = Radius * sin(fromDToR(lambdan)) * cos(fromDToR(fin));
        Z1 = Radius * sin(fromDToR(fin));
        X2 = Radius * cos(fromDToR(lambdak)) * cos(fromDToR(fik));
        Y2 = Radius * sin(fromDToR(lambdak)) * cos(fromDToR(fik));
        Z2 = Radius * sin(fromDToR(fik));
        //alfa - угол между 2 точками на пов-сти Земли и центром Земли в градусах, l - длина прямой проведенной м/у двумя точками
        double alfa, l = sqrt( pow(X1 - X2,2) + pow(Y1 - Y2,2) + pow(Z1 - Z2,2) );
        alfa = acos((pow(Radius,2)*2 - pow(l,2))/(2*pow(Radius,2)))*57.3;
        //Длина ортодромии
        double orto = Pi*Radius/180 * alfa;
        int N = 50;
        double tanpsi0, f1, l1;

        if(lambdan > lambdak)
        {
            std::swap(lambdak, lambdan);
            std::swap(fik, fin);
        }
        f1 = fin;
        l1 = lambdan;


        mpWebView->page()->runJavaScript(QString("addLoksodroma(%1,%2,%3,%4)").arg(lambdan).arg(fin).arg(lambdak).arg(fik));
        for(size_t i = 1; i < N; i++)
        {
            double prevF = f1, prevL = l1;
            tanpsi0 = (cos(fromDToR(f1))*tan(fromDToR(fik))/sin(fromDToR(lambdak - (l1+0.001))) - sin(fromDToR(f1))/tan(fromDToR(lambdak-(l1+0.001))));
            double psi0;
            psi0 = 3.1415/2 - atan(tanpsi0);
            qDebug() << QString("tanpsi0[%1]=%2").arg(i).arg(tanpsi0);
            qDebug() << QString("psi0[%1]=%2").arg(i).arg(psi0);
            qDebug() << 57.3*orto/(N-1) * cos(psi0)/(Radius);
            f1 += 57.3*orto/(N-1)*cos(psi0)/Radius;
            l1 += 57.3*orto/(N-1) * sin(psi0)/(Radius*cos(fromDToR(prevF)));
            qDebug() << QString(" Latitude[%1]=%2").arg(i).arg(f1) << QString("Longitude[%1]=%2").arg(i).arg(l1);

            mpWebView->page()->runJavaScript(QString("addOrtodroma(%1,%2,%3,%4)").arg(prevL).arg(prevF).arg(l1).arg(f1));
        }
    }
}


void MainWindow::processPolygonData(const QVariant& result)
{
    QVariantList lists = result.value<QVariantList>();
    for(QVariant s : lists)
    {
        QVariantMap mp = s.value<QVariantMap>();
        QVariantList cords = mp["St"].value<QVariantList>();
        for(size_t i = 0; i < cords.size() - 2; i+=2)
        {
            double X = cords[i].value<double>(), Y = cords[i+1].value<double>();
            QGeoCoordinate ltln;
            ltln.setLatitude(X);
            ltln.setLongitude(Y);
            Polygon.push_back(ltln);
        }
    }
}

void MainWindow::on_pushButton_4_clicked()
{
    if(ui->pushButton->isEnabled())
    {
        ui->lineEdit->setStyleSheet("background-color: gray;");
        ui->lineEdit->setDisabled(true);
        ui->lineEdit_2->setStyleSheet("background-color: gray;");
        ui->lineEdit_2->setDisabled(true);
        ui->pushButton->setStyleSheet("background-color: gray;");
        ui->pushButton->setDisabled(true);
        ui->pushButton_2->setStyleSheet("background-color: gray;");
        ui->pushButton_2->setDisabled(true);
        ui->pushButton_3->setStyleSheet("background-color: gray;");
        ui->pushButton_3->setDisabled(true);
        mpWebView->page()->runJavaScript(QString("addDrawInteraction()"));
    }
    else
    {
        ui->lineEdit->setStyleSheet("");
        ui->lineEdit->setDisabled(false);
        ui->lineEdit_2->setStyleSheet("");
        ui->lineEdit_2->setDisabled(false);
        ui->pushButton->setStyleSheet("");
        ui->pushButton->setDisabled(false);
        ui->pushButton_2->setStyleSheet("");
        ui->pushButton_2->setDisabled(false);
        ui->pushButton_3->setStyleSheet("");
        ui->pushButton_3->setDisabled(false);
        mpWebView->page()->runJavaScript(QString("sendPolygon()"), [this](const QVariant &result)
        {
            QVariantList lists = result.value<QVariantList>();
            for(QVariant s : lists)
            {
                QVariantMap mp = s.value<QVariantMap>();
                QVariantList cords = mp["St"].value<QVariantList>();
                for(size_t i = 0; i < cords.size() - 2; i+=2)
                {
                    double X = cords[i].value<double>(), Y = cords[i+1].value<double>();
                    QGeoCoordinate ltln;
                    ltln.setLatitude(X);
                    ltln.setLongitude(Y);
                    // qDebug() << ltln;
                    Polygon.push_back(ltln);
                }
            }
            qDebug() << Polygon;
        });
        mpWebView->page()->runJavaScript(QString("disableDrawInteraction()"));
    }
}

